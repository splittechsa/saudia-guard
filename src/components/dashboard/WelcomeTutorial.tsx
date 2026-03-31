import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, Eye, Shield, TrendingUp, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Zap,
    title: "مرحباً بك في ذكاء سبلت!",
    desc: "تم تفعيل حسابك بنجاح. إليك شرحاً سريعاً لمعاني البيانات التي ستراها في لوحة التحكم.",
    color: "text-primary",
  },
  {
    icon: BarChart3,
    title: "مؤشر الامتثال التشغيلي",
    desc: "الرسم البياني يعرض نتائج التدقيق بمرور الوقت. كلما ارتفع الخط، كان أداء المتجر أفضل. النتيجة فوق 80% تعني التزاماً ممتازاً.",
    color: "text-primary",
  },
  {
    icon: Eye,
    title: "بطاقات التدقيق",
    desc: "كل بطاقة تمثل عملية تدقيق واحدة. الأخضر = ناجح، الأصفر = تحذير، الأحمر = فشل. اضغط عليها لرؤية التفاصيل.",
    color: "text-emerald",
  },
  {
    icon: Shield,
    title: "التنبيهات الأمنية",
    desc: "عند رصد مخالفة خطيرة (أقل من 50%)، ستتلقى تنبيهاً فورياً في جرس الإشعارات. راقب الجرس دائماً!",
    color: "text-destructive",
  },
  {
    icon: TrendingUp,
    title: "التقارير والتصدير",
    desc: "اذهب لصفحة التقارير لتحليل البيانات بفلاتر متقدمة، وتصدير النتائج كملف CSV أو PDF.",
    color: "text-accent",
  },
];

export function WelcomeTutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md rounded-2xl bg-card border border-border p-8 shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 left-4 p-1 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>

          <div className="text-center">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {(() => {
                const StepIcon = steps[step].icon;
                return (
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4`}>
                    <StepIcon className={`w-7 h-7 ${steps[step].color}`} />
                  </div>
                );
              })()}
              <h2 className="text-lg font-bold text-foreground mb-2 font-arabic">{steps[step].title}</h2>
              <p className="text-sm text-muted-foreground font-arabic leading-relaxed">{steps[step].desc}</p>
            </motion.div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-6">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-primary w-6" : "bg-border"}`} />
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="font-arabic text-xs">
              <ChevronRight className="w-4 h-4 me-1" /> السابق
            </Button>
            {step < steps.length - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)} className="font-arabic text-xs">
                التالي <ChevronLeft className="w-4 h-4 ms-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={onClose} className="font-arabic text-xs bg-emerald hover:bg-emerald/90 text-emerald-foreground">
                ابدأ الآن! 🚀
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
