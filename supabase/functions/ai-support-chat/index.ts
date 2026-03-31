import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `أنت مساعد ذكاء سبلت للدعم الفني. أنت تساعد التجار في حل مشاكلهم التقنية المتعلقة بنظام الرقابة الذكية.

معلومات عن النظام:
- نظام ذكاء سبلت يستخدم كاميرات RTSP للمراقبة التشغيلية بالذكاء الاصطناعي
- الكاميرات المدعومة: Hikvision, Dahua, EZVIZ
- صيغة RTSP لـ Hikvision: rtsp://username:password@IP:554/Streaming/Channels/101
- صيغة RTSP لـ Dahua: rtsp://username:password@IP:554/cam/realmonitor?channel=1&subtype=0
- صيغة RTSP لـ EZVIZ: rtsp://admin:verification_code@IP:554/h264/ch1/main/av_stream
- الباقات: أساسي (12 ساعة/يوم)، احترافي (18 ساعة/يوم)، مؤسسي (24 ساعة/يوم)
- المحرك يتصل بالسيرفر كل 5 دقائق لجلب الإعدادات
- مشاكل شائعة: انقطاع البث (تحقق من البورت 554)، كلمة مرور خاطئة، IP متغير

قواعد:
- أجب باللغة العربية دائماً
- إذا لم تستطع حل المشكلة، اقترح على التاجر فتح تذكرة للدعم التقني البشري
- كن مختصراً ومفيداً
- لا تطلب معلومات حساسة مثل كلمات المرور`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticket_id, message, conversation_history } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(conversation_history || []),
      { role: "user", content: message },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited", reply: "النظام مشغول حالياً، حاول مرة أخرى بعد قليل." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted", reply: "خدمة الذكاء الاصطناعي غير متاحة حالياً." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await aiResponse.json();
    const reply = data.choices?.[0]?.message?.content || "عذراً، لم أتمكن من معالجة طلبك.";

    // Save AI response as a message in the ticket if ticket_id provided
    if (ticket_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabase.from("ticket_messages").insert({
        ticket_id,
        sender_id: "00000000-0000-0000-0000-000000000000",
        sender_role: "ai_bot",
        message: reply,
      });
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("AI support error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
