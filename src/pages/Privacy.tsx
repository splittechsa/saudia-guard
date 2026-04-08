import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <nav className="glass-strong sticky top-0 z-50 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground font-arabic">{t("brand")}</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="text-muted-foreground font-arabic">
            <ArrowLeft className="w-4 h-4 me-1" /> {t("legal.back")}
          </Button>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-16 prose-invert">
        <h1 className="text-3xl font-bold text-foreground mb-2 font-arabic">{t("legal.privacy_title")}</h1>
        <p className="text-xs text-muted-foreground mb-10 font-arabic">{t("legal.updated")}</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">1. معالجة البيانات مقابل تخزين البيانات</h2>
            <p className="font-arabic">
              تفرق ذكاء سبلت بوضوح بين معالجة البيانات وتخزينها. تُعالج الصور الملتقطة من كاميرات المراقبة في ذاكرة مؤقتة (RAM) وتُمحى فوراً بعد التحليل.
            </p>
            <div className="mt-4 rounded-xl border border-emerald/20 bg-emerald/5 p-5">
              <p className="font-arabic font-semibold text-emerald">✅ بيان صريح:</p>
              <p className="font-arabic mt-2">
                نحن لا نخزن أي صور أو مقاطع فيديو خام على خوادمنا. نحتفظ فقط بالنتائج النصية للتحليل (النقاط والملاحظات والتقارير). لا يتم حفظ أي بكسل من البث.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">2. البيانات التي نجمعها</h2>
            <ul className="list-disc list-inside space-y-2 font-arabic">
              <li>معلومات الحساب: الاسم والبريد الإلكتروني ورقم الهاتف</li>
              <li>بيانات المتجر: اسم المتجر وساعات العمل</li>
              <li>نتائج التحليل: درجات الامتثال والملاحظات النصية فقط</li>
              <li>البيانات التقنية: عناوين IP واستخدام الخدمة (لأغراض الأمان فقط)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">3. إقامة البيانات والتخزين</h2>
            <p className="font-arabic">
              جميع البيانات مخزنة في بيئات سحابية مشفرة وآمنة، متوافقة تماماً مع:
            </p>
            <ul className="list-disc list-inside space-y-2 font-arabic mt-3">
              <li>المكتب الوطني لإدارة البيانات (NDMO)</li>
              <li>نظام حماية البيانات الشخصية (PDPL)</li>
              <li>معايير التشفير المتقدمة (AES-256)</li>
            </ul>
            <p className="font-arabic mt-3">
              تُستخدم بنية تحتية سحابية مشفرة لتخزين جميع سجلات التحليلات مع ضمان عدم الوصول غير المصرح به.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">4. الامتثال</h2>
            <p className="font-arabic">
              نلتزم بنظام حماية البيانات الشخصية السعودي (PDPL) ولائحة حماية البيانات العامة الأوروبية (GDPR) للعملاء الدوليين. نقوم بإجراء تقييمات تأثير منتظمة على الخصوصية ونحتفظ بسجلات شاملة لأنشطة المعالجة.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">5. حقوقك</h2>
            <p className="font-arabic">
              يحق لك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها في أي وقت. يمكنك التواصل معنا عبر البريد الإلكتروني: info@splittech.sa
            </p>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="font-arabic text-xs text-muted-foreground/60">
              للتواصل: info@splittech.sa
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
