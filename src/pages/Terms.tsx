import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, ArrowLeft, AlertOctagon, Gavel, Radio, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div dir="rtl" className="min-h-screen bg-background text-right relative overflow-hidden">
      {/* تأثير خلفية خفيف لتوحيد الهوية */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <nav className="glass-strong sticky top-0 z-50 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-black text-foreground font-arabic">سبلت تيك | شروط الخدمة</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="text-muted-foreground font-arabic">
            <ArrowLeft className="w-4 h-4 me-1" /> الرجوع
          </Button>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-16 relative z-10">
        <div className="mb-12 border-b border-border pb-8 text-center md:text-right">
          <h1 className="text-4xl font-black text-foreground mb-4 font-arabic tracking-tight">الشروط والأحكام القانونية</h1>
          <p className="text-sm text-muted-foreground font-arabic leading-relaxed max-w-2xl">
            باستخدامكم لمنصة "سبلت تيك"، فإنكم تقرون بالالتزام الكامل ببنود هذه الاتفاقية التي تنظم العلاقة القانونية بين التاجر وشركة سبلت تيك لتقنية المعلومات.
          </p>
          <p className="text-[10px] text-primary font-bold mt-4 font-mono uppercase tracking-[0.2em]">Last Updated: April 2026</p>
        </div>

        <div className="space-y-12 text-base text-muted-foreground leading-relaxed font-arabic">
          
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Radio className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">1. تعريف الخدمة</h2>
            </div>
            <p>
              توفر منصة سبلت تيك (SplitTech AI) نظاماً للرقابة التشغيلية يعتمد على تقنيات الرؤية الحاسوبية. الخدمة مقدمة "كما هي" لغرض التدقيق والتحليل التشغيلي فقط، وتعتبر شركة سبلت تيك مزوداً للحل التقني وليست طرفاً في إدارة الموارد البشرية للمنشأة.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">2. إقرار الامتثال والخصوصية</h2>
            </div>
            <div className="bg-secondary/30 rounded-2xl p-6 border border-border">
              <p className="mb-4">يقر العميل (التاجر) بمسؤوليته القانونية الكاملة والمنفردة عما يلي:</p>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>إبلاغ جميع الموظفين والتابعين له بوجود نظام تحليل يعتمد على الذكاء الاصطناعي بشكل رسمي وخطّي.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>وضع لوحات إرشادية (ملصقات) توضح وجود كاميرات مراقبة مرتبطة بأنظمة تحليل ذكي، وفقاً لمتطلبات وزارة الداخلية السعودية.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>الالتزام الكامل بـ "نظام حماية البيانات الشخصية" (PDPL) فيما يخص معالجة بيانات الموظفين.</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
                 <p className="text-xs text-destructive font-bold leading-6">
                    ⚠️ تنبيه: تخلي "سبلت تيك" مسؤوليتها القانونية عن أي دعوى ترفع من قبل أطراف ثالثة (موظفين أو عملاء) ناتجة عن إخفاق التاجر في واجب الإفصاح والإبلاغ.
                 </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">3. حماية الملكية الفكرية والعبث التقني</h2>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border relative overflow-hidden">
               <p className="mb-4 relative z-10">
                 يُحظر منعاً باتاً على العميل أو أي طرف ثالث مفوض من قبله القيام بـ:
               </p>
               <ul className="space-y-3 text-sm relative z-10">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">●</span>
                    <span>محاولة الهندسة العكسية (Reverse Engineering) أو فك تشفير المحرك البرمجي Split-Core AI.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">●</span>
                    <span>تعديل المكونات الصلبة (Hardware) لأجهزة Split-Pi أو محاولة استخراج نظام التشغيل منها.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">●</span>
                    <span>استخدام مخرجات المنصة لبناء نماذج ذكاء اصطناعي منافسة.</span>
                  </li>
               </ul>
               <div className="absolute top-0 left-0 p-8 opacity-[0.02] pointer-events-none">
                  <Gavel className="w-48 h-48" />
               </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Gavel className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">4. القانون الحاكم وفض النزاعات</h2>
            </div>
            <p>
              تخضع هذه الاتفاقية وتفسر وفقاً لأنظمة <span className="text-foreground font-bold underline decoration-primary underline-offset-4">المملكة العربية السعودية</span>. وفي حال حدوث أي نزاع -لا قدر الله- يتم السعي لحله ودياً خلال 30 يوماً، وفي حال تعذر ذلك، تختص المحاكم التجارية بمدينة <span className="text-foreground font-bold">جدة</span> بالفصل فيه.
            </p>
          </section>

          <section className="pt-10 border-t border-border flex flex-col items-center gap-6">
            <p className="text-xs text-muted-foreground/60 text-center font-arabic max-w-lg italic leading-6">
              من خلال ضغطكم على "موافق" أو استخدامكم للمنصة، فإنكم توقعون إلكترونياً على هذه الاتفاقية وتعتبر ملزمة قانونياً بموجب نظام التعاملات الإلكترونية السعودي.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground bg-secondary/50 px-6 py-3 rounded-full border border-border">
              للاستفسارات القانونية: info@splittech.sa
            </div>
          </section>
        </div>
      </article>

      <footer className="text-center pb-12 opacity-30 pointer-events-none font-mono text-[9px] tracking-[0.5em] uppercase">
        SplitTech IT · Terms of Service V4.0 · Saudi Arabia
      </footer>
    </div>
  );
}