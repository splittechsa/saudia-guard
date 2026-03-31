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

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // 1. Stores with security alerts yesterday
    const { data: alerts } = await supabase
      .from("security_alerts")
      .select("store_id, alert_type, message")
      .gte("created_at", startOfYesterday.toISOString())
      .lte("created_at", endOfYesterday.toISOString())
      .eq("resolved", false);

    // 2. Stores with system logs (errors/restarts) yesterday
    const { data: sysLogs } = await supabase
      .from("system_logs")
      .select("store_id, log_type, metadata")
      .gte("created_at", startOfYesterday.toISOString())
      .lte("created_at", endOfYesterday.toISOString())
      .in("log_type", ["auto_restart", "error", "debug"]);

    // 3. Stores with low audit scores yesterday
    const { data: lowScores } = await supabase
      .from("analytics_logs")
      .select("store_id, score")
      .gte("created_at", startOfYesterday.toISOString())
      .lte("created_at", endOfYesterday.toISOString())
      .lt("score", 50);

    // Collect unique problematic store IDs
    const problemStoreIds = new Set<string>();
    const issueMap: Record<string, string[]> = {};

    const addIssue = (storeId: string, issue: string) => {
      problemStoreIds.add(storeId);
      if (!issueMap[storeId]) issueMap[storeId] = [];
      issueMap[storeId].push(issue);
    };

    alerts?.forEach(a => {
      if (a.store_id) addIssue(a.store_id, `تنبيه أمني: ${a.alert_type}`);
    });
    sysLogs?.forEach(l => addIssue(l.store_id, `سجل نظام: ${l.log_type}`));
    lowScores?.forEach(s => addIssue(s.store_id, `نتيجة منخفضة: ${s.score}%`));

    if (problemStoreIds.size === 0) {
      return new Response(JSON.stringify({ report: "no_issues", stores_checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get store names
    const { data: stores } = await supabase
      .from("stores")
      .select("id, name")
      .in("id", Array.from(problemStoreIds));

    const storeNames: Record<string, string> = {};
    stores?.forEach(s => { storeNames[s.id] = s.name; });

    // Build report
    const reportLines = Array.from(problemStoreIds).map(id => {
      const name = storeNames[id] || id.slice(0, 8);
      const issues = issueMap[id]?.join("، ") || "";
      return `• ${name}: ${issues}`;
    });

    const reportMessage = `📋 تقرير الصحة اليومي — ${yesterday.toLocaleDateString("ar-SA")}:\n\n${problemStoreIds.size} متجر واجه مشاكل بالأمس:\n${reportLines.join("\n")}\n\nيرجى فحص هذه المتاجر استباقياً.`;

    // Send as broadcast to IT
    const { data: owners } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_owner");

    const senderId = owners?.[0]?.user_id || "00000000-0000-0000-0000-000000000000";

    await supabase.from("broadcasts").insert({
      sender_id: senderId,
      message: reportMessage,
      target_role: "it_support",
    });

    return new Response(JSON.stringify({
      report: "sent",
      stores_with_issues: problemStoreIds.size,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Daily health check error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
