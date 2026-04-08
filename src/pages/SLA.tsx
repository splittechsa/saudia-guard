import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, ArrowLeft, Timer, Activity, Zap, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SLA() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div dir="rtl" className="min-h-screen bg-background text-right relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <nav className="glass-strong sticky top-0 z-50 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground font-arabic">سبلت تيك | اتفاقية الخدمة</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="text-muted-foreground font-arabic">
            <ArrowLeft className="w-4 h-4 me-1" /> الرجوع
          </Button>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-16 relative z-10">
        <div className="mb-12 border-b border-border pb-8">
          <h1 className="text-4xl font-black text-foreground mb-4 font-arabic tracking-tight">اتفاقية مستوى الخدمة (SLA)</h1>
          <p className="text-sm text-muted-foreground font-arabic">تضمن سبلت تيك استمرارية أعمالكم بأعلى معايير الدقة والتوفر الرقمي.</p>
        </div>

        <div className="space-y-12 text-base text-muted-foreground leading-relaxed font-arabic">
          
          <section className="relative group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">1. التزام وقت التشغيل (Uptime)</h2>
            </div>
            <p>
              نحن ندرك أن الرقابة التشغيلية لا تتوقف. لذا تلتزم سبلت تيك بتوفير نسبة توافر للخدمات السحابية لا تقل عن <span className="text-foreground font-bold font-mono">99.5%</span> شهرياً. يتم حساب هذه النسبة على مدار الساعة طوال أيام الأسبوع، مع استثناء فترات الصيانة المجدولة التي نبلغكم بها مسبقاً.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">2. دقة محرك الذكاء الاصطناعي</h2>
            </div>
            <p className="mb-4">
              يعمل محرك <span className="text-foreground font-bold">Split-Core AI</span> بمعايير تدقيق عالمية. نحن نلتزم بعتبة دقة لا تقل عن <span className="text-primary font-bold">85%</span> في تحليل السلوكيات التشغيلية (مثل وجود الموظفين، الزحام، والامتثال).
            </p>
            <div className="p-4 bg-secondary/30 rounded-2xl border border-border text-xs leading-6">
              <span className="text-primary font-bold">ملاحظة:</span> تعتمد الدقة بشكل مباشر على جودة تركيب الكاميرات وزوايا الرؤية الموصى بها في دليل الإعداد.
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Timer className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">3. سرعة الاستجابة والدعم التقني</h2>
            </div>
            <div className="rounded-[2rem] border border-border overflow-hidden bg-card shadow-sm">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="p-4 text-foreground font-bold">مستوى الخطورة</th>
                    <th className="p-4 text-foreground font-bold">وقت الاستجابة</th>
                    <h className="p-4 text-foreground font-bold">المستهدف للحل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr className="hover:bg-primary/[0.02] transition-colors">
                    <td className="p-4"><Badge className="bg-destructive/10 text-destructive border-none">حرجة (توقف الخدمة)</Badge></td>
                    <td className="p-4 font-mono">60 دقيقة</td>
                    <td className="p-4">4 ساعات عمل</td>
                  </tr>
                  <tr className="hover:bg-primary/[0.02] transition-colors">
                    <td className="p-4"><Badge className="bg-orange-500/10 text-orange-500 border-none">عالية (عطل جزئي)</Badge></td>
                    <td className="p-4 font-mono">4 ساعات</td>
                    <td className="p-4">24 ساعة عمل</td>
                  </tr>
                  <tr className="hover:bg-primary/[0.02] transition-colors">
                    <td className="p-4"><Badge className="bg-blue-500/10 text-blue-500 border-none">اعتيادية (استفسارات)</Badge></td>
                    <td className="p-4 font-mono">24 ساعة</td>
                    <td className="p-4">72 ساعة عمل</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Scale className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">4. المسؤولية القانونية والحدود</h2>
            </div>
            <p>
              نظام سبلت تيك هو أداة "دعم اتخاذ قرار" و "تدقيق آلي". التقارير الصادرة عن المنصة هي استشارية بطبيعتها وتعتمد على الرؤية الحاسوبية. لا تتحمل الشركة المسؤولية عن القرارات الإدارية أو القانونية التي يتخذها العميل بناءً على هذه التقارير، كما يخلي العميل مسؤولية الشركة عن أي انقطاع ناتج عن خدمات الإنترنت المحلية في المتجر.
            </p>
          </section>

          <section className="pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-muted-foreground/60 italic">
              هذه الاتفاقية ملزمة قانونياً وتخضع لأنظمة المملكة العربية السعودية.
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Mail className="w-3 h-3 text-primary" /> info@splittech.sa
            </div>
          </section>
        </div>
      </article>

      <footer className="text-center pb-12 opacity-20 pointer-events-none font-mono text-[10px] tracking-[0.4em]">
        SPLIT TECH AI ENGINE · SLA V2.1 · JEDDAH HQ
      </footer>
    </div>
  );
}

// مكون Badge بسيط للاستخدام داخل الجدول
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${className}`}>
      {children}
    </span>
  );
}