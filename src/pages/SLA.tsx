import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SLA() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background">
      <nav className="glass-strong sticky top-0 z-50 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground font-arabic">{t("brand")}</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 me-1" /> {isRtl ? "رجوع" : "Back"}
          </Button>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-16 prose-invert">
        <h1 className="text-3xl font-bold text-foreground mb-2 font-arabic">{t("legal.sla_title")}</h1>
        <p className="text-xs text-muted-foreground mb-10 font-mono">Last updated: March 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "1. نطاق الخدمة" : "1. Service Scope"}</h2>
            <p className="font-arabic">{isRtl
              ? "توفر عين الذكاء خدمة رقابة تشغيلية تعتمد على الذكاء الاصطناعي. الخدمة ذات طبيعة \"تدقيقية فقط\" — تقدم ملاحظات ودرجات امتثال وليست بديلاً عن القرارات الإدارية البشرية."
              : "Eye of Intelligence provides an AI-powered operational auditing service. The service is \"audit-only\" in nature — it provides observations and compliance scores and is not a substitute for human managerial decisions."
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "2. عتبة الدقة" : "2. Accuracy Threshold"}</h2>
            <p className="font-arabic">{isRtl
              ? "يلتزم محرك Split-Core AI بتحقيق دقة لا تقل عن 80% في تحليلات الرقابة التشغيلية. تُقاس الدقة بناءً على مقارنات دورية مع تقييمات بشرية مرجعية. في حال انخفاض الدقة عن هذا الحد، يحق للعميل طلب إعادة معايرة النظام."
              : "The Split-Core AI Engine commits to achieving a minimum of 80% accuracy in operational audit analytics. Accuracy is measured based on periodic comparisons with human reference evaluations. If accuracy falls below this threshold, the Client is entitled to request system recalibration."
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "3. وقت التشغيل" : "3. Uptime"}</h2>
            <p className="font-arabic">{isRtl
              ? "تستهدف الشركة توفير وقت تشغيل بنسبة 99.5% للخدمات السحابية. لا يشمل هذا الالتزام فترات الصيانة المجدولة (التي يتم الإعلان عنها قبل 48 ساعة) أو انقطاع الخدمة الناتج عن مشاكل الاتصال بالإنترنت في موقع العميل."
              : "The Company targets 99.5% uptime for cloud services. This commitment excludes scheduled maintenance windows (announced 48 hours in advance) and service interruptions caused by internet connectivity issues at the Client's premises."
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "4. أوقات الاستجابة" : "4. Response Times"}</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-card">
                    <th className="text-start p-3 text-foreground font-arabic">{isRtl ? "الأولوية" : "Priority"}</th>
                    <th className="text-start p-3 text-foreground font-arabic">{isRtl ? "وقت الاستجابة" : "Response Time"}</th>
                    <th className="text-start p-3 text-foreground font-arabic">{isRtl ? "وقت الحل" : "Resolution Time"}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="p-3 font-arabic">{isRtl ? "حرجة" : "Critical"}</td>
                    <td className="p-3 font-arabic">{isRtl ? "ساعة واحدة" : "1 hour"}</td>
                    <td className="p-3 font-arabic">{isRtl ? "4 ساعات" : "4 hours"}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-arabic">{isRtl ? "عالية" : "High"}</td>
                    <td className="p-3 font-arabic">{isRtl ? "4 ساعات" : "4 hours"}</td>
                    <td className="p-3 font-arabic">{isRtl ? "24 ساعة" : "24 hours"}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-arabic">{isRtl ? "عادية" : "Normal"}</td>
                    <td className="p-3 font-arabic">{isRtl ? "24 ساعة" : "24 hours"}</td>
                    <td className="p-3 font-arabic">{isRtl ? "72 ساعة" : "72 hours"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "5. تنبيهات الأمان" : "5. Security Alerts"}</h2>
            <p className="font-arabic">{isRtl
              ? "أي محاولة عبث بأجهزة Split-Pi يتم اكتشافها تلقائياً وتُسجل في لوحة النزاهة القانونية. يحتفظ فريقنا القانوني بحق اتخاذ إجراءات فورية لحماية الملكية الفكرية."
              : "Any tampering attempt with Split-Pi hardware is automatically detected and logged in the Legal Integrity Dashboard. Our legal team reserves the right to take immediate action to protect intellectual property."
            }</p>
          </section>
        </div>
      </article>
    </div>
  );
}
