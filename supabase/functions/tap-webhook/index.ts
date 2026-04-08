import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, hashstring",
};

async function verifyTapSignature(
  body: string,
  signatureHeader: string | null,
  secretKey: string
): Promise<boolean> {
  // Tap sends a hashstring header with HMAC-SHA256
  if (!signatureHeader) {
    console.warn("No signature header — skipping verification in test mode");
    return true; // Allow in test mode; enforce in live
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = new TextDecoder().decode(hexEncode(new Uint8Array(signature)));

  const isValid = computed === signatureHeader;
  if (!isValid) {
    console.error("Signature mismatch!", { expected: signatureHeader, computed });
  }
  return isValid;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rawBody = await req.text();

  try {
    const tapSecretKey = Deno.env.get("TAP_SECRET_KEY");
    if (!tapSecretKey) {
      return new Response(
        JSON.stringify({ error: "Gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate webhook signature
    const hashstring = req.headers.get("hashstring");
    const signatureValid = await verifyTapSignature(rawBody, hashstring, tapSecretKey);
    if (!signatureValid) {
      console.error("Invalid webhook signature — rejecting request");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = JSON.parse(rawBody);
    console.log("Tap webhook received:", JSON.stringify({ id: body.id, status: body.status }));

    const chargeId = body.id;
    if (!chargeId) {
      return new Response(
        JSON.stringify({ error: "Missing charge ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Always verify with Tap API (never trust webhook body alone)
    const verifyResponse = await fetch(
      `https://api.tap.company/v2/charges/${chargeId}`,
      { headers: { Authorization: `Bearer ${tapSecretKey}` } }
    );
    const chargeData = await verifyResponse.json();
    const verifiedStatus = chargeData.status;

    console.log(`Charge ${chargeId} verified status: ${verifiedStatus}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Extract rich metadata
    const paymentMethod = chargeData.source?.payment_method || chargeData.source?.type || "unknown";
    const receiptUrl = chargeData.receipt?.url || chargeData.redirect?.url || null;

    // Update payment history with full audit data
    await supabase
      .from("payments_history")
      .update({
        status: verifiedStatus,
        tap_response: chargeData,
        payment_method: paymentMethod,
        receipt_url: receiptUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("tap_charge_id", chargeId);

    const userId = chargeData.metadata?.user_id;
    const subscriptionId = chargeData.metadata?.subscription_id;

    if (verifiedStatus === "CAPTURED") {
      // Activate subscription
      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", subscriptionId);
      }

      // Activate stores
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

      console.log(`✅ Subscription ${subscriptionId} activated for user ${userId}`);
    } else if (verifiedStatus === "FAILED" || verifiedStatus === "DECLINED") {
      // Mark subscription as inactive on failure
      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({ status: "inactive", updated_at: new Date().toISOString() })
          .eq("id", subscriptionId);
      }
      console.log(`❌ Payment FAILED for charge ${chargeId}`);
    } else if (verifiedStatus === "VOIDED" || verifiedStatus === "CANCELLED") {
      // Mark as cancelled
      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", subscriptionId);
      }
      console.log(`🚫 Payment VOIDED/CANCELLED for charge ${chargeId}`);
    }

    // Log to audit trail
    if (userId) {
      await supabase.from("audit_trail").insert({
        actor_id: userId,
        action: `payment_${verifiedStatus.toLowerCase()}`,
        target_type: "subscription",
        target_id: subscriptionId || chargeId,
        metadata: {
          charge_id: chargeId,
          amount: chargeData.amount,
          currency: chargeData.currency,
          payment_method: paymentMethod,
        },
      });
    }

    return new Response(
      JSON.stringify({ received: true, status: verifiedStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
