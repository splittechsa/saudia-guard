import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { amount, currency, tier, token_id, subscription_id } = await req.json();

    if (!amount || !token_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, token_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tapSecretKey = Deno.env.get("TAP_SECRET_KEY");
    if (!tapSecretKey) {
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create charge via Tap API
    const chargePayload = {
      amount,
      currency: currency || "SAR",
      customer_initiated: true,
      threeDSecure: true,
      save_card: false,
      description: `Split Tech subscription - ${tier || "pro"}`,
      metadata: {
        user_id: user.id,
        subscription_id: subscription_id || "",
        tier: tier || "",
      },
      source: { id: token_id },
      redirect: {
        url: `${req.headers.get("origin") || supabaseUrl}/dashboard/payment-success`,
      },
      post: {
        url: `${supabaseUrl}/functions/v1/tap-webhook`,
      },
    };

    const tapResponse = await fetch("https://api.tap.company/v2/charges", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tapSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chargePayload),
    });

    const chargeData = await tapResponse.json();

    if (!tapResponse.ok) {
      console.error("Tap API error:", chargeData);
      return new Response(
        JSON.stringify({ error: "Payment failed", details: chargeData }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log payment in history using service role
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient.from("payments_history").insert({
      user_id: user.id,
      subscription_id: subscription_id || null,
      tap_charge_id: chargeData.id,
      amount,
      currency: currency || "SAR",
      status: chargeData.status,
      tap_response: chargeData,
    });

    return new Response(
      JSON.stringify({
        charge_id: chargeData.id,
        status: chargeData.status,
        redirect_url: chargeData.transaction?.url || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
