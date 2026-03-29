import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
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
        <h1 className="text-3xl font-bold text-foreground mb-2 font-arabic">{t("legal.privacy_title")}</h1>
        <p className="text-xs text-muted-foreground mb-10 font-mono">Last updated: March 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "1. معالجة البيانات مقابل تخزين البيانات" : "1. Data Processing vs. Data Storage"}</h2>
            <p className="font-arabic">{isRtl
              ? "تفرق عين الذكاء بوضوح بين معالجة البيانات وتخزينها. تُعالج الصور الملتقطة من كاميرات المراقبة في ذاكرة مؤقتة (RAM) وتُمحى فوراً بعد التحليل. لا يتم تخزين أي صور أو مقاطع فيديو على خوادمنا. نحتفظ فقط بالنتائج النصية للتحليل (النقاط والملاحظات والتقارير)."
              : "Eye of Intelligence clearly distinguishes between data processing and data storage. Images captured from surveillance cameras are processed in temporary memory (RAM) and purged immediately after analysis. No images or video recordings are stored on our servers. We retain only textual analysis results (scores, observations, and reports)."
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "2. البيانات التي نجمعها" : "2. Data We Collect"}</h2>
            <ul className="list-disc list-inside space-y-2 font-arabic">
              {(isRtl ? [
                "معلومات الحساب: الاسم والبريد الإلكتروني ورقم الهاتف",
                "بيانات المتجر: اسم المتجر وساعات العمل",
                "نتائج التحليل: درجات الامتثال والملاحظات النصية فقط",
                "البيانات التقنية: عناوين IP واستخدام الخدمة (لأغراض الأمان فقط)"
              ] : [
                "Account information: name, email, phone number",
                "Store data: store name, operating hours",
                "Analysis results: compliance scores and text observations only",
                "Technical data: IP addresses, service usage (for security purposes only)"
              ]).map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "3. إقامة البيانات" : "3. Data Residency"}</h2>
            <p className="font-arabic">{isRtl
              ? "جميع البيانات مخزنة في خوادم مشفرة داخل المملكة العربية السعودية (منطقة الدمام)، متوافقة تماماً مع المكتب الوطني لإدارة البيانات (NDMO) ونظام حماية البيانات الشخصية (PDPL)."
              : "All data is stored on encrypted servers within the Kingdom of Saudi Arabia (Dammam Region), fully compliant with the National Data Management Office (NDMO) and the Personal Data Protection Law (PDPL)."
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "4. الامتثال" : "4. Compliance"}</h2>
            <p className="font-arabic">{isRtl
              ? "نلتزم بنظام حماية البيانات الشخصية السعودي (PDPL) ولائحة حماية البيانات العامة الأوروبية (GDPR) للعملاء الدوليين. نقوم بإجراء تقييمات تأثير منتظمة على الخصوصية ونحتفظ بسجلات شاملة لأنشطة المعالجة."
              : "We comply with the Saudi Personal Data Protection Law (PDPL) and the EU General Data Protection Regulation (GDPR) for international clients. We conduct regular privacy impact assessments and maintain comprehensive records of processing activities."
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">{isRtl ? "5. حقوقك" : "5. Your Rights"}</h2>
            <p className="font-arabic">{isRtl
              ? "يحق لك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها في أي وقت. يمكنك التواصل معنا عبر البريد الإلكتروني: privacy@sovereign-ai.sa"
              : "You have the right to request access to, correction of, or deletion of your personal data at any time. Contact us at: privacy@sovereign-ai.sa"
            }</p>
          </section>
        </div>
      </article>
    </div>
  );
}
