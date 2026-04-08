import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SLA() {
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
        <h1 className="text-3xl font-bold text-foreground mb-2 font-arabic">{t("legal.sla_title")}</h1>
        <p className="text-xs text-muted-foreground mb-10 font-arabic">{t("legal.updated")}</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">1. نطاق الخدمة</h2>
            <p className="font-arabic">
              توفر ذكاء سبلت خدمة رقابة تشغيلية تعتمد على الذكاء الاصطناعي. الخدمة ذات طبيعة "تدقيقية فقط" — تقدم ملاحظات ودرجات امتثال وليست بديلاً عن القرارات الإدارية البشرية.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">2. عتبة الدقة</h2>
            <p className="font-arabic">
              يلتزم محرك Split-Core AI بتحقيق دقة لا تقل عن 80% في تحليلات الرقابة التشغيلية. تُقاس الدقة بناءً على مقارنات دورية مع تقييمات بشرية مرجعية. في حال انخفاض الدقة عن هذا الحد، يحق للعميل طلب إعادة معايرة النظام.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">3. وقت التشغيل</h2>
            <p className="font-arabic">
              تستهدف الشركة توفير وقت تشغيل بنسبة 99.5% للخدمات السحابية. لا يشمل هذا الالتزام فترات الصيانة المجدولة (التي يتم الإعلان عنها قبل 48 ساعة) أو انقطاع الخدمة الناتج عن مشاكل الاتصال بالإنترنت في موقع العميل.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">4. أوقات الاستجابة</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-card">
                    <th className="text-start p-3 text-foreground font-arabic">الأولوية</th>
                    <th className="text-start p-3 text-foreground font-arabic">وقت الاستجابة</th>
                    <th className="text-start p-3 text-foreground font-arabic">وقت الحل</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="p-3 font-arabic">حرجة</td>
                    <td className="p-3 font-arabic">ساعة واحدة</td>
                    <td className="p-3 font-arabic">4 ساعات</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-arabic">عالية</td>
                    <td className="p-3 font-arabic">4 ساعات</td>
                    <td className="p-3 font-arabic">24 ساعة</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-arabic">عادية</td>
                    <td className="p-3 font-arabic">24 ساعة</td>
                    <td className="p-3 font-arabic">72 ساعة</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">5. تنبيهات الأمان</h2>
            <p className="font-arabic">
              أي محاولة عبث بأجهزة Split-Pi يتم اكتشافها تلقائياً وتُسجل في لوحة النزاهة القانونية. يحتفظ فريقنا القانوني بحق اتخاذ إجراءات فورية لحماية الملكية الفكرية.
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
