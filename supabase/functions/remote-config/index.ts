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

    // Check if request is authenticated (service role or valid JWT)
    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("apikey") || url.searchParams.get("apikey");
    const isServiceRole = apiKey === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let isAuthenticated = isServiceRole;
    if (!isAuthenticated && authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      isAuthenticated = !!data?.user;
    }

    const { data, error } = await supabase
      .from("stores")
      .select("id, name, custom_queries, query_status, operating_hours, hardware_choice, rtsp_url, camera_username, camera_password, is_active, interval_minutes")
      .eq("id", storeId)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter custom_queries: only return items with status "approved"
    let approvedQueries: any[] = [];
    const queries = data.custom_queries || [];
    
    if (Array.isArray(queries)) {
      if (queries.length > 0 && typeof queries[0] === "object" && queries[0] !== null) {
        approvedQueries = queries.filter((q: any) => q.status === "approved");
      } else {
        approvedQueries = data.query_status === "approved" ? queries : [];
      }
    }

    // Build config — only include camera_password for service role
    const config: Record<string, any> = {
      store_name: data.name,
      custom_questions: approvedQueries,
      working_hours: data.operating_hours || {},
      hardware_choice: data.hardware_choice,
      rtsp_url: data.rtsp_url || null,
      camera_username: data.camera_username || null,
      is_active: data.is_active ?? true,
      interval_minutes: data.interval_minutes ?? 5,
    };

    // Only expose camera_password to service role requests
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
