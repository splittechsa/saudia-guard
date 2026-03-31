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

    const url = new URL(req.url);
    const storeId = url.searchParams.get("store_id");

    if (!storeId) {
      return new Response(JSON.stringify({ error: "store_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("apikey") || url.searchParams.get("apikey");
    const isServiceRole = apiKey === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let isAuthenticated = isServiceRole;
    if (!isAuthenticated && authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      isAuthenticated = !!data?.user;
    }

    // Fetch store + subscription data
    const { data, error } = await supabase
      .from("stores")
      .select("id, name, custom_queries, query_status, operating_hours, hardware_choice, rtsp_url, camera_username, camera_password, is_active, interval_minutes, remote_command, debug_mode, store_status, user_id")
      .eq("id", storeId)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch subscription for quota enforcement
    const { data: subData } = await supabase
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", data.user_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);

    const subscription = subData?.[0];
    const tier = subscription?.tier || "basic";
    const maxHours: Record<string, number> = { basic: 12, pro: 18, enterprise: 24 };
    const allowedHours = maxHours[tier] || 12;

    // Server-side operating hours validation
    let isWithinSchedule = true;
    let reason = "Within scheduled operating hours";
    const opHours = data.operating_hours as any;

    if (opHours && typeof opHours === "object" && opHours.start !== undefined && opHours.end !== undefined) {
      const now = new Date();
      // Use Saudi Arabia timezone (UTC+3)
      const saHour = (now.getUTCHours() + 3) % 24;
      const start = opHours.start;
      const end = opHours.end;

      if (end > start) {
        isWithinSchedule = saHour >= start && saHour < end;
      } else {
        // Overnight range
        isWithinSchedule = saHour >= start || saHour < end;
      }

      if (!isWithinSchedule) {
        reason = `Outside scheduled hours (${start}:00 - ${end}:00 SA). Current: ${saHour}:00`;
      }
    }

    // Determine effective is_active
    const effectiveActive = data.is_active && isWithinSchedule && data.store_status === "active";

    let approvedQueries: any[] = [];
    const queries = data.custom_queries || [];
    if (Array.isArray(queries)) {
      if (queries.length > 0 && typeof queries[0] === "object" && queries[0] !== null) {
        approvedQueries = queries.filter((q: any) => q.status === "approved");
      } else {
        approvedQueries = data.query_status === "approved" ? queries : [];
      }
    }

    const config: Record<string, any> = {
      store_name: data.name,
      custom_questions: approvedQueries,
      working_hours: data.operating_hours || {},
      hardware_choice: data.hardware_choice,
      rtsp_url: data.rtsp_url || null,
      camera_username: data.camera_username || null,
      is_active: effectiveActive,
      interval_minutes: data.interval_minutes ?? 5,
      remote_command: data.remote_command || "run",
      debug_mode: data.debug_mode ?? false,
      reason,
      subscription_tier: tier,
      allowed_hours: allowedHours,
    };

    if (isServiceRole) {
      config.camera_password = data.camera_password || null;
    }

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
