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

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Find open tickets with no IT/support response in 30 min
    const { data: staleTickets } = await supabase
      .from("support_tickets")
      .select("id, subject, priority, user_id, created_at")
      .eq("status", "open")
      .lt("created_at", thirtyMinAgo);

    if (!staleTickets || staleTickets.length === 0) {
      return new Response(JSON.stringify({ escalated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which tickets have no IT/support response
    const escalationTargets = [];
    for (const ticket of staleTickets) {
      const { data: msgs } = await supabase
        .from("ticket_messages")
        .select("sender_role")
        .eq("ticket_id", ticket.id)
        .in("sender_role", ["it_support", "super_owner", "customer_support"])
        .limit(1);

      if (!msgs || msgs.length === 0) {
        escalationTargets.push(ticket);
      }
    }

    if (escalationTargets.length === 0) {
      return new Response(JSON.stringify({ escalated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get super_owner user IDs for broadcast
    const { data: owners } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_owner");

    const ownerIds = owners?.map(o => o.user_id) || [];
    const senderIdForBroadcast = ownerIds[0] || "00000000-0000-0000-0000-000000000000";

    // Create broadcast alert
    const ticketList = escalationTargets
      .map(t => `• ${t.subject} (${t.priority === "high" ? "عالية" : t.priority === "medium" ? "متوسطة" : "منخفضة"})`)
      .join("\n");

    await supabase.from("broadcasts").insert({
      sender_id: senderIdForBroadcast,
      message: `⚠️ تنبيه تصعيد تلقائي: ${escalationTargets.length} تذكرة بدون رد لأكثر من 30 دقيقة:\n${ticketList}`,
      target_role: "it_support",
    });

    // Update ticket status to in_progress
    for (const ticket of escalationTargets) {
      await supabase
        .from("support_tickets")
        .update({ status: "in_progress" })
        .eq("id", ticket.id);
    }

    return new Response(JSON.stringify({ escalated: escalationTargets.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Auto-escalation error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
