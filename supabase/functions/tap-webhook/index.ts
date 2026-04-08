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
    const body = await req.json();
    console.log("Tap webhook received:", JSON.stringify(body));

    const chargeId = body.id;
    const status = body.status;

    if (!chargeId) {
      return new Response(JSON.stringify({ error: "Missing charge ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify charge with Tap API
    const tapSecretKey = Deno.env.get("TAP_SECRET_KEY");
    if (!tapSecretKey) {
      return new Response(
        JSON.stringify({ error: "Gateway not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const verifyResponse = await fetch(
      `https://api.tap.company/v2/charges/${chargeId}`,
      {
        headers: { Authorization: `Bearer ${tapSecretKey}` },
      }
    );
    const chargeData = await verifyResponse.json();
    const verifiedStatus = chargeData.status;

    console.log(`Charge ${chargeId} verified status: ${verifiedStatus}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Update payment history
    await supabase
      .from("payments_history")
      .update({
        status: verifiedStatus,
        tap_response: chargeData,
        updated_at: new Date().toISOString(),
      })
      .eq("tap_charge_id", chargeId);

    // If captured, activate subscription
    if (verifiedStatus === "CAPTURED") {
      const userId = chargeData.metadata?.user_id;
      const subscriptionId = chargeData.metadata?.subscription_id;

      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", subscriptionId);
      }

      // Activate user's stores
      if (userId) {
        await supabase
          .from("stores")
          .update({
            is_active: true,
            store_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("store_status", "draft");
      }

      console.log(
        `Subscription ${subscriptionId} activated for user ${userId}`
      );
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
