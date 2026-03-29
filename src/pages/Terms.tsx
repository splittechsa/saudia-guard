import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
        <h1 className="text-3xl font-bold text-foreground mb-2 font-arabic">{t("legal.tos_title")}</h1>
        <p className="text-xs text-muted-foreground mb-10 font-mono">Last updated: March 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "1. مقدمة" : "1. Introduction"}</h2>
            <p className="font-arabic">{isRtl
              ? "تحكم هذه الشروط والأحكام استخدامك لمنصة عين الذكاء (\"المنصة\")، وهي خدمة رقابة تشغيلية مدعومة بالذكاء الاصطناعي مقدمة من Split Technology Co. (\"الشركة\"). باستخدام المنصة، فإنك توافق على الالتزام بهذه الشروط."
              : "These Terms of Service govern your use of the Eye of Intelligence platform (\"Platform\"), an AI-powered operational auditing service provided by Split Technology Co. (\"Company\"). By using the Platform, you agree to be bound by these Terms."
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "2. مسؤولية العميل" : "2. Client Responsibility"}</h2>
            <p className="font-arabic">{isRtl
              ? "يتحمل العميل المسؤولية الكاملة عن إبلاغ جميع الموظفين العاملين في المنشأة بوجود نظام الرقابة بالذكاء الاصطناعي. يجب الحصول على الموافقات اللازمة وفقاً لنظام حماية البيانات الشخصية (PDPL) قبل تفعيل الخدمة."
              : "The Client bears full responsibility for notifying all employees working at the premises about the existence of the AI auditing system. Required consents must be obtained in accordance with the Personal Data Protection Law (PDPL) before service activation."
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "3. حظر العبث" : "3. Anti-Tampering"}</h2>
            <p className="font-arabic">{isRtl
              ? "يُحظر صراحةً أي محاولة للهندسة العكسية أو التفكيك أو العبث بأجهزة Split-Pi أو البرمجيات المرتبطة بها. أي انتهاك لهذا البند سيؤدي إلى إنهاء الخدمة فوراً وقد يترتب عليه إجراءات قانونية."
              : "Any attempt to reverse-engineer, disassemble, or tamper with Split-Pi hardware or associated software is strictly prohibited. Any violation of this clause will result in immediate service termination and may lead to legal proceedings."
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "4. وقت التشغيل والاتصال" : "4. Service Uptime & Connectivity"}</h2>
            <p className="font-arabic">{isRtl
              ? "تسعى الشركة لتوفير الخدمة بشكل مستمر. ومع ذلك، فإن الاتصال بالإنترنت يقع تحت المسؤولية الكاملة للعميل. لا تتحمل الشركة أي مسؤولية عن انقطاع الخدمة الناتج عن مشاكل الشبكة في موقع العميل."
              : "The Company strives to provide continuous service. However, internet connectivity is the sole responsibility of the Client. The Company bears no liability for service interruptions caused by network issues at the Client's premises."
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "5. القانون الحاكم" : "5. Governing Law"}</h2>
            <p className="font-arabic">{isRtl
              ? "تخضع هذه الشروط للأنظمة واللوائح المعمول بها في المملكة العربية السعودية، بما في ذلك نظام حماية البيانات الشخصية (PDPL) ولوائح هيئة الاتصالات وتقنية المعلومات (CITC)."
              : "These Terms shall be governed by and construed in accordance with the laws and regulations of the Kingdom of Saudi Arabia, including the Personal Data Protection Law (PDPL) and Communications and Information Technology Commission (CITC) regulations."
            }</p>
          </section>
        </div>
      </article>
    </div>
  );
}
