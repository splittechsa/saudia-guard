import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Simple in-memory rate limiter per store (max 20 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(storeId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(storeId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(storeId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

function getApiKey(req: Request): string | null {
  return req.headers.get("x-api-key") ?? req.headers.get("apikey");
}

function normalizeAudits(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (body?.type === "bulk" && Array.isArray(body.records)) return body.records;
  if (body && typeof body === "object" && ("score" in body || "result" in body || "summary" in body || "observations" in body)) {
    return [body];
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const payloadType = typeof body?.type === "string" ? body.type : null;
    const audits: any[] = normalizeAudits(body);
    const isSyncing = body?.is_syncing === true;
    const syncTotal = Number(body?.total ?? body?.sync_total ?? 0);
    const syncBatch = Number(body?.synced ?? body?.sync_batch ?? 0);

    // --- API Key Authentication ---
    const apiKeyHeader = getApiKey(req);
    if (!apiKeyHeader) {
      return new Response(JSON.stringify({ error: "Missing x-api-key or apikey header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: keyRow, error: keyError } = await supabase
      .from("store_api_keys")
      .select("store_id, is_active")
      .eq("api_key", apiKeyHeader)
      .single();

    if (keyError || !keyRow || !keyRow.is_active) {
      return new Response(JSON.stringify({ error: "Invalid or inactive API key" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authorizedStoreId = keyRow.store_id;
    const payloadStoreId = typeof body?.store_id === "string" ? body.store_id : null;

    if (payloadStoreId && payloadStoreId !== authorizedStoreId) {
      return new Response(JSON.stringify({ error: "API key does not match store_id in payload" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const unauthorized = audits.some((audit) => audit?.store_id && audit.store_id !== authorizedStoreId);
    if (unauthorized) {
      return new Response(JSON.stringify({ error: "API key does not match store_id in payload" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payloadType === "reset_command") {
      const { error: resetError } = await supabase
        .from("stores")
        .update({ remote_command: "run" })
        .eq("id", authorizedStoreId);

      if (resetError) {
        console.error("Reset command error:", resetError);
        return new Response(JSON.stringify({ error: resetError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("system_logs").insert({
        store_id: authorizedStoreId,
        log_type: "reset_command",
        metadata: {
          source: "split_engine",
          next_command: "run",
          timestamp: new Date().toISOString(),
        },
      });

      return new Response(JSON.stringify({ success: true, action: "reset_command", remote_command: "run" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payloadType === "camera_failure" || body?.camera_failure === true) {
      const { error: cameraError } = await supabase.from("security_alerts").insert({
        store_id: authorizedStoreId,
        alert_type: "camera_offline",
        message: `تنبيه: كاميرا الفرع غير متصلة — ${body?.camera_failure_reason || "سبب غير محدد"}`,
      });

      if (cameraError) {
        console.error("Camera failure insert error:", cameraError);
        return new Response(JSON.stringify({ error: cameraError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, action: "camera_failure" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (audits.length === 0) {
      return new Response(JSON.stringify({ error: "No audit data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!checkRateLimit(authorizedStoreId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Max 20 requests/minute per store." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    // Check if debug_mode is enabled for this store
    const { data: storeData } = await supabase
      .from("stores")
      .select("debug_mode")
      .eq("id", authorizedStoreId)
      .single();

    const debugMode = storeData?.debug_mode ?? false;

    // Validate and map each audit line
    const rows = audits.map((audit) => {
      const score = typeof audit.score === "number" ? audit.score : null;
      let status = audit.status || "pass";

      if (score !== null) {
        if (score < 50) status = "fail";
        else if (score < 80) status = "warning";
        else status = "pass";
      }

      return {
        store_id: authorizedStoreId,
        result: audit.results || audit.result || null,
        score,
        status,
        summary: audit.summary || audit.store || null,
        observations: audit.observations || null,
        ai_reasoning: audit.ai_reasoning || null,
        confidence_score: typeof audit.confidence_score === "number" ? audit.confidence_score : null,
        client_environment: audit.client_environment || null,
        created_at: audit.timestamp || new Date().toISOString(),
      };
    });

    const batchRows = rows.slice(0, 50);

    const { data, error } = await supabase
      .from("analytics_logs")
      .insert(batchRows)
      .select("id, store_id, score, status");

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If debug_mode is ON, save raw AI response to system_logs
    if (debugMode) {
      const debugRows = audits.map((audit) => ({
        store_id: authorizedStoreId,
        log_type: "debug",
        raw_response: audit.raw_ai_response || audit.result || null,
        metadata: {
          score: audit.score,
          confidence: audit.confidence_score,
          timestamp: audit.timestamp,
          engine_version: audit.engine_version || "unknown",
        },
      }));

      const { error: debugError } = await supabase.from("system_logs").insert(debugRows);
      if (debugError) console.error("Debug log insert error:", debugError);
    }

    // Auto-create security alerts for scores < 50
    const failedAudits = (data || []).filter((audit: any) => audit.score !== null && audit.score < 50);
    if (failedAudits.length > 0) {
      const alertRows = failedAudits.map((audit: any) => ({
        store_id: audit.store_id,
        alert_type: audit.score < 30 ? "critical" : "warning",
        message: `تنبيه تلقائي: نتيجة التدقيق ${audit.score}% — أقل من الحد المسموح (50%)`,
      }));

      const { error: alertError } = await supabase.from("security_alerts").insert(alertRows);
      if (alertError) console.error("Alert insert error:", alertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: data?.length || 0,
        alerts_created: failedAudits.length,
        debug_logged: debugMode,
        is_syncing: isSyncing,
        sync_progress: isSyncing ? { batch: syncBatch, total: syncTotal } : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Ingest error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});