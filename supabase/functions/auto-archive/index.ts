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

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoff = cutoffDate.toISOString();

    // Move old logs to archive in batches
    let totalArchived = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: oldLogs, error: fetchErr } = await supabase
        .from("analytics_logs")
        .select("*")
        .lt("created_at", cutoff)
        .limit(500);

      if (fetchErr) throw fetchErr;
      if (!oldLogs || oldLogs.length === 0) {
        hasMore = false;
        break;
      }

      // Insert into archive
      const archiveRows = oldLogs.map((log: any) => ({
        id: log.id,
        store_id: log.store_id,
        score: log.score,
        status: log.status,
        summary: log.summary,
        result: log.result,
        observations: log.observations,
        ai_reasoning: log.ai_reasoning,
        confidence_score: log.confidence_score,
        client_environment: log.client_environment,
        disputed: log.disputed,
        created_at: log.created_at,
      }));

      const { error: insertErr } = await supabase
        .from("analytics_logs_archive")
        .upsert(archiveRows, { onConflict: "id" });

      if (insertErr) throw insertErr;

      // Delete archived rows from main table
      const ids = oldLogs.map((l: any) => l.id);
      const { error: delErr } = await supabase
        .from("analytics_logs")
        .delete()
        .in("id", ids);

      if (delErr) throw delErr;

      totalArchived += oldLogs.length;
      if (oldLogs.length < 500) hasMore = false;
    }

    return new Response(
      JSON.stringify({ success: true, archived: totalArchived }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
