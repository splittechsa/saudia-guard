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

    // Get all active stores
    const { data: activeStores } = await supabase
      .from("stores")
      .select("id, name, is_active, store_status, interval_minutes, remote_command")
      .eq("store_status", "active")
      .eq("is_active", true);

    if (!activeStores || activeStores.length === 0) {
      return new Response(JSON.stringify({ checked: 0, restarted: 0, alerted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let restarted = 0;
    let alerted = 0;
    const offlineStores: string[] = [];

    for (const store of activeStores) {
      const expectedInterval = (store.interval_minutes || 5) * 2; // 2x tolerance
      const cutoff = new Date(Date.now() - expectedInterval * 60 * 1000).toISOString();

      // Check last heartbeat (analytics_log or system_log)
      const { data: recentLogs } = await supabase
        .from("analytics_logs")
        .select("created_at")
        .eq("store_id", store.id)
        .gte("created_at", cutoff)
        .limit(1);

      const hasHeartbeat = recentLogs && recentLogs.length > 0;

      if (!hasHeartbeat) {
        // Auto-restart: send restart command if not already restarting
        if (store.remote_command !== "restart") {
          await supabase
            .from("stores")
            .update({ remote_command: "restart" })
            .eq("id", store.id);

          // Log the auto-restart
          await supabase.from("system_logs").insert({
            store_id: store.id,
            log_type: "auto_restart",
            metadata: { reason: "heartbeat_timeout", interval: expectedInterval },
          });

          restarted++;
        } else {
          // Already sent restart but still offline — alert IT
          offlineStores.push(store.name);
          alerted++;

          await supabase.from("security_alerts").insert({
            store_id: store.id,
            alert_type: "engine_offline",
            message: `محرك المتجر "${store.name}" لا يستجيب بعد محاولة إعادة التشغيل التلقائية`,
          });
        }
      }
    }

    // Broadcast alert if stores are critically offline
    if (offlineStores.length > 0) {
      const { data: owners } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "super_owner");

      const senderId = owners?.[0]?.user_id || "00000000-0000-0000-0000-000000000000";

      await supabase.from("broadcasts").insert({
        sender_id: senderId,
        message: `🔴 تنبيه حرج: ${offlineStores.length} محرك لا يستجيب بعد إعادة التشغيل التلقائية:\n${offlineStores.map(n => `• ${n}`).join("\n")}`,
        target_role: "it_support",
      });
    }

    return new Response(JSON.stringify({
      checked: activeStores.length,
      restarted,
      alerted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Heartbeat monitor error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
