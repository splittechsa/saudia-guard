import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Validate and map each audit line
    const rows = audits.map((audit) => {
      if (!audit.store_id) {
        throw new Error("Missing store_id in audit entry");
      }

      const score = typeof audit.score === "number" ? audit.score : null;
      let status = audit.status || "pass";
      if (score !== null) {
        if (score < 50) status = "fail";
        else if (score < 80) status = "warning";
        else status = "pass";
      }

      return {
        store_id: audit.store_id,
        result: audit.results || audit.result || null,
        score,
        status,
        summary: audit.summary || audit.store || null,
        created_at: audit.timestamp || new Date().toISOString(),
      };
    });

    const { data, error } = await supabase
      .from("analytics_logs")
      .insert(rows)
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
