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
    const audits: any[] = Array.isArray(body) ? body : [body];

    if (audits.length === 0) {
      return new Response(JSON.stringify({ error: "No audit data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- API Key Authentication ---
    const apiKeyHeader = req.headers.get("x-api-key");
    if (!apiKeyHeader) {
      return new Response(JSON.stringify({ error: "Missing x-api-key header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate API key against store_api_keys table
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

    // Ensure all audit entries match the authorized store
    const unauthorized = audits.some((a) => a.store_id && a.store_id !== authorizedStoreId);
    if (unauthorized) {
      return new Response(JSON.stringify({ error: "API key does not match store_id in payload" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Rate Limiting ---
    if (!checkRateLimit(authorizedStoreId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Max 20 requests/minute per store." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

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
        created_at: audit.timestamp || new Date().toISOString(),
      };
    });

    // Batch insert (max 50 per request)
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

    // Auto-create security alerts for scores < 50
    const failedAudits = (data || []).filter((d: any) => d.score !== null && d.score < 50);
    if (failedAudits.length > 0) {
      const alertRows = failedAudits.map((audit: any) => ({
        store_id: audit.store_id,
        alert_type: audit.score < 30 ? "critical" : "warning",
        message: `تنبيه تلقائي: نتيجة التدقيق ${audit.score}% — أقل من الحد المسموح (50%)`,
      }));

      const { error: alertError } = await supabase.from("security_alerts").insert(alertRows);
      if (alertError) {
        console.error("Alert insert error:", alertError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted: data?.length || 0, alerts_created: failedAudits.length }),
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
