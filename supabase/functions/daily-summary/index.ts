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
    const { data: stores, error: storesErr } = await supabase
      .from("stores")
      .select("id, name, user_id")
      .eq("is_active", true);

    if (storesErr || !stores || stores.length === 0) {
      return new Response(JSON.stringify({ message: "No active stores" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Get today's audits
    const { data: audits } = await supabase
      .from("analytics_logs")
      .select("store_id, score, status, result")
      .gte("created_at", todayStart);

    // Group by store
    const storeAudits: Record<string, any[]> = {};
    (audits || []).forEach((a: any) => {
      if (!storeAudits[a.store_id]) storeAudits[a.store_id] = [];
      storeAudits[a.store_id].push(a);
    });

    // Get profiles for emails
    const userIds = [...new Set(stores.map((s: any) => s.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    // Build summaries per user
    const summaries: { email: string; name: string; storeSummaries: string[] }[] = [];

    const userStores: Record<string, any[]> = {};
    stores.forEach((s: any) => {
      if (!userStores[s.user_id]) userStores[s.user_id] = [];
      userStores[s.user_id].push(s);
    });

    for (const [userId, userStoreList] of Object.entries(userStores)) {
      const profile = profileMap[userId];
      if (!profile?.email) continue;

      const storeSummaries: string[] = [];
      for (const store of userStoreList) {
        const sa = storeAudits[store.id] || [];
        const totalCustomers = sa.reduce((sum: number, a: any) => sum + (Number(a.result?.q2) || 0), 0);
        const avgScore = sa.length > 0 ? Math.round(sa.reduce((s: number, a: any) => s + (a.score || 0), 0) / sa.length) : 0;
        const violations = sa.filter((a: any) => a.status === "fail").length;
        storeSummaries.push(
          `📍 ${store.name}: ${sa.length} تدقيقات | زبائن: ${totalCustomers} | متوسط الالتزام: ${avgScore}% | مخالفات: ${violations}`
        );
      }

      summaries.push({
        email: profile.email,
        name: profile.full_name || "التاجر",
        storeSummaries,
      });
    }

    // Log the summaries (in production, this would send emails)
    console.log(`Daily summary generated for ${summaries.length} merchants`);
    for (const s of summaries) {
      console.log(`To: ${s.email} | ${s.storeSummaries.join(" | ")}`);
    }

    return new Response(
      JSON.stringify({ success: true, summaries_count: summaries.length, summaries }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Daily summary error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
