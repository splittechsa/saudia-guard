import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, ArrowLeft, Building2, MapPin, Mail, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div dir="rtl" className="min-h-screen bg-background text-right">
      <nav className="glass-strong sticky top-0 z-50 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground font-arabic">سبلت تيك | SplitTech</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="text-muted-foreground font-arabic">
            <ArrowLeft className="w-4 h-4 me-1" /> الرجوع للخلف
          </Button>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-16 prose-invert">
        <div className="mb-12 border-b border-border pb-8">
          <h1 className="text-4xl font-extrabold text-foreground mb-4 font-arabic">سياسة الخصوصية وحماية البيانات</h1>
          <p className="text-sm text-muted-foreground font-arabic">آخر تحديث: أبريل 2026م</p>
        </div>

        {/* بطاقة معلومات الشركة - تعزز الثقة مثل المنصات الكبرى */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 bg-muted/30 p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 text-sm">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="font-arabic">مؤسسة سبلت تيك لتقنية المعلومات</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Landmark className="w-4 h-4 text-primary" />
            <span className="font-arabic text-xs">سجل تجاري: 7053975251</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-arabic">المقر الرئيسي: جدة، المملكة العربية السعودية</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-primary" />
            <span className="font-arabic">info@splittech.sa</span>
          </div>
        </div>

        <div className="space-y-10 text-base text-muted-foreground leading-relaxed">
          
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 font-arabic">1. سيادة البيانات الوطنية (Data Residency)</h2>
            <p className="font-arabic">
              نحن في "سبلت تيك" نؤمن بأن بياناتك هي أصل من أصولك الوطنية. لذا، نلتزم بتخزين ومعالجة جميع البيانات الحساسة والتقارير داخل حدود المملكة العربية السعودية. يتم استضافة بنية "سبلت تيك" التحتية على خوادم 
              <span className="text-foreground font-bold"> جوجل كلاود (Google Cloud) </span> 
              في منطقة <span className="text-foreground font-bold">الدمام</span>، لضمان أعلى مستويات السرعة والامتثال للأنظمة المحلية.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 font-arabic">2. مبدأ "الخصوصية بالابتكار" (Privacy by Design)</h2>
            <p className="font-arabic mb-4">
              نظامنا مصمم تقنياً بحيث لا يحتاج لتخزين "البث المرئي". نحن نعالج الصورة في جزء من الثانية داخل الذاكرة المؤقتة (RAM) لاستخراج الأرقام والنتائج فقط، ثم نقوم بمحوها فوراً.
            </p>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 border-r-4 border-r-primary">
              <p className="font-arabic font-bold text-primary mb-2">💡 التزام سبلت تيك الواضح:</p>
              <p className="font-arabic text-sm leading-6 text-foreground">
                "لا نقوم بتسجيل، تخزين، أو أرشفة أي لقطات فيديو . ما يتم حفظه في قاعدة بياناتنا هو فقط (أرقام، نصوص، وتحليلات) ناتجة عن الذكاء الاصطناعي لمساعدتك في اتخاذ القرار."
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 font-arabic">3. الامتثال للأنظمة السعودية (PDPL)</h2>
            <p className="font-arabic">
              تتوافق جميع عملياتنا مع نظام حماية البيانات الشخصية الصادر عن <span className="text-foreground font-bold">الهيئة السعودية للبيانات والذكاء الاصطناعي (SDAIA)</span> ومركز (NDMO). نحن نطبق أعلى معايير التشفير (AES-256) لحماية وصولك للوحة التحكم.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 font-arabic">4. البيانات التي يتم جمعها</h2>
            <ul className="space-y-3 font-arabic">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong className="text-foreground">بيانات الهوية:</strong> الاسم، البريد الرسمي للشركة، ورقم السجل التجاري.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong className="text-foreground">بيانات التشغيل:</strong> نتائج جودة الخدمة، مستويات الزحام، والتزام الموظفين.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong className="text-foreground">البيانات التقنية:</strong> سجلات الدخول لضمان أمن حسابك ومنع الاختراقات.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 font-arabic">5. التواصل وحقوق المستخدم</h2>
            <p className="font-arabic mb-4">
              بموجب الأنظمة، يحق لك الوصول إلى تقاريرك، تعديلها، أو طلب إتلافها. فريقنا في مدينة جدة جاهز للرد على استفساراتكم المتعلقة بأمن البيانات.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="mailto:info@splittech.sa" className="flex items-center gap-2 text-primary hover:underline font-arabic text-sm">
                <Mail className="w-4 h-4" /> info@splittech.sa
              </a>
            </div>
          </section>

          <footer className="pt-10 border-t border-border mt-16 text-center">
            <p className="font-arabic text-xs text-muted-foreground/60 italic">
              سبلت تيك - نحن لا نراقب، نحن نطور. جميع الحقوق محفوظة لمؤسسة سبلت تيك لتقنية المعلومات 2026م.
            </p>
          </footer>
        </div>
      </article>
    </div>
  );
}