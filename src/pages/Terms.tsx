import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
        <h1 className="text-3xl font-bold text-foreground mb-2 font-arabic">{t("legal.tos_title")}</h1>
        <p className="text-xs text-muted-foreground mb-10 font-arabic">{t("legal.updated")}</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">1. مقدمة</h2>
            <p className="font-arabic">
              تحكم هذه الشروط والأحكام استخدامك لمنصة ذكاء سبلت ("المنصة")، وهي خدمة رقابة تشغيلية مدعومة بالذكاء الاصطناعي مقدمة من شركة سبلت للتقنية ("الشركة"). باستخدام المنصة، فإنك توافق على الالتزام بهذه الشروط.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">2. مسؤولية العميل</h2>
            <div className="space-y-3">
              <p className="font-arabic">
                يتحمل العميل المسؤولية القانونية الكاملة عن إبلاغ جميع الموظفين العاملين في المنشأة بوجود نظام الرقابة بالذكاء الاصطناعي. يشمل ذلك:
              </p>
              <ul className="list-disc list-inside space-y-2 font-arabic text-muted-foreground/80">
                <li>إخطار جميع الموظفين خطياً بوجود نظام تحليل الذكاء الاصطناعي قبل تفعيل الخدمة.</li>
                <li>الحصول على الموافقات اللازمة من الموظفين وفقاً لنظام حماية البيانات الشخصية.</li>
                <li>توثيق عملية الإبلاغ والاحتفاظ بنسخ من إقرارات الموظفين.</li>
                <li>تحديث الإخطارات عند أي تغيير جوهري في نطاق المراقبة أو طريقة التحليل.</li>
              </ul>
              <p className="font-arabic text-destructive/80 font-semibold">
                ⚠️ تخلي الشركة مسؤوليتها الكاملة عن أي تبعات قانونية ناتجة عن عدم إبلاغ العميل لموظفيه.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">3. حظر العبث</h2>
            <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
              <p className="font-arabic font-semibold text-foreground">⛔ تحذير قانوني صارم</p>
              <p className="font-arabic">
                يُحظر حظراً باتاً ومطلقاً أي محاولة للهندسة العكسية أو التفكيك أو التعديل أو العبث بأجهزة Split-Pi أو البرمجيات المرتبطة بها أو أي مكون من مكونات محرك Split-Core AI. يشمل هذا الحظر:
              </p>
              <ul className="list-disc list-inside space-y-2 font-arabic text-muted-foreground/80">
                <li>فك تشفير البرمجيات أو محاولة الوصول إلى الكود المصدري.</li>
                <li>التعديل على الأجهزة أو استبدال مكوناتها دون إذن خطي.</li>
                <li>محاولة اعتراض البيانات المشفرة أثناء النقل أو المعالجة.</li>
                <li>أي نشاط يهدف إلى تجاوز آليات الحماية الأمنية.</li>
              </ul>
              <p className="font-arabic text-destructive font-semibold">
                أي انتهاك لهذا البند سيؤدي إلى إنهاء الخدمة فوراً واتخاذ إجراءات قانونية تشمل المطالبة بالتعويضات.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">4. وقت التشغيل والاتصال</h2>
            <p className="font-arabic">
              تسعى الشركة لتوفير الخدمة بشكل مستمر. ومع ذلك، فإن الاتصال بالإنترنت يقع تحت المسؤولية الكاملة للعميل. لا تتحمل الشركة أي مسؤولية عن انقطاع الخدمة الناتج عن مشاكل الشبكة في موقع العميل.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 font-arabic">5. القانون الحاكم</h2>
            <p className="font-arabic">
              تخضع هذه الشروط للأنظمة واللوائح المعمول بها في المملكة العربية السعودية، بما في ذلك نظام حماية البيانات الشخصية ولوائح هيئة الاتصالات وتقنية المعلومات.
            </p>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="font-arabic text-xs text-muted-foreground/60">
              للتواصل: splittechsa@outlook.com
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
