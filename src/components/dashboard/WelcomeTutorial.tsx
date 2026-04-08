import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, Eye, Shield, TrendingUp, Zap, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Zap,
    title: "مرحباً بك في ذكاء سبلت!",
    desc: "تم تفعيل حسابك بنجاح. إليك شرحاً سريعاً لمعاني البيانات التي ستراها في لوحة التحكم الخاصة بك.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "مؤشر الامتثال التشغيلي",
    desc: "يعرض هذا الرسم البياني جودة أداء المتجر. النتيجة فوق 80% تعني أنك في النطاق الآمن والمثالي.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Eye,
    title: "بطاقات التدقيق اللحظي",
    desc: "كل بطاقة تمثل جولة تدقيق قام بها الذكاء الاصطناعي. الأخضر يعني التزاماً تاماً، والأحمر يتطلب تدخلكم.",
    color: "text-emerald",
    bgColor: "bg-emerald/10",
  },
  {
    icon: Shield,
    title: "نظام التنبيهات الذكي",
    desc: "في حال رصد أي مخالفة جسيمة، سيصلك تنبيه فوري عبر الجرس والجوال لضمان استمرارية العمل.",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    icon: TrendingUp,
    title: "التقارير الإحصائية",
    desc: "بإمكانك دائماً تصدير تقارير مفصلة بصيغة PDF لمشاركتها مع فريقك أو الإدارة العليا.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

export function WelcomeTutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/40 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-md rounded-[2.5rem] glass-strong border border-white/10 p-10 shadow-2xl relative overflow-hidden carbon-grid"
        >
          {/* ديمور جمالي في الخلفية */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

          <button 
            onClick={onClose} 
            className="absolute top-6 left-6 p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center relative z-10">
            <AnimatePresence mode="wait">
              <motion.div 
                key={step} 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {(() => {
                  const StepIcon = steps[step].icon;
                  return (
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-[2rem] ${steps[step].bgColor} border border-white/5 mb-8 relative group`}>
                      <StepIcon className={`w-10 h-10 ${steps[step].color} transition-transform group-hover:scale-110`} />
                      <motion.div 
                         animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                         transition={{ repeat: Infinity, duration: 2 }}
                         className={`absolute inset-0 rounded-[2rem] ${steps[step].bgColor} blur-xl -z-10`}
                      />
                    </div>
                  );
                })()}
                
                <div className="flex items-center justify-center gap-2 mb-3">
                   <Sparkles className="w-4 h-4 text-primary opacity-50" />
                   <h2 className="text-2xl font-black text-foreground font-arabic tracking-tight">{steps[step].title}</h2>
                </div>
                
                <p className="text-sm text-muted-foreground font-arabic leading-relaxed px-4">
                  {steps[step].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress dots - المطور */}
          <div className="flex justify-center gap-2 mt-10">
            {steps.map((_, i) => (
              <motion.div 
                key={i} 
                animate={{ 
                  width: i === step ? 32 : 8,
                  backgroundColor: i === step ? "hsl(var(--primary))" : "rgba(255,255,255,0.1)"
                }}
                className="h-2 rounded-full transition-all" 
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-10">
            <Button 
              variant="ghost" 
              onClick={() => setStep(Math.max(0, step - 1))} 
              disabled={step === 0} 
              className="font-arabic font-bold text-xs rounded-xl hover:bg-secondary"
            >
              <ChevronRight className="w-4 h-4 me-1" /> السابق
            </Button>

            {step < steps.length - 1 ? (
              <Button 
                onClick={() => setStep(step + 1)} 
                className="font-arabic font-bold text-xs bg-primary text-primary-foreground rounded-xl px-6 h-11 shadow-lg shadow-primary/20 transition-all hover:scale-105"
              >
                التالي <ChevronLeft className="w-4 h-4 ms-1" />
              </Button>
            ) : (
              <Button 
                onClick={onClose} 
                className="font-arabic font-black text-xs bg-emerald hover:bg-emerald/90 text-emerald-foreground rounded-xl px-8 h-11 shadow-lg shadow-emerald/20 transition-all hover:scale-105"
              >
                ابدأ رحلتك الآن! 🚀
              </Button>
            )}
          </div>

          <p className="text-center text-[8px] text-muted-foreground/30 mt-8 font-mono tracking-[0.3em] uppercase">
            SplitTech Intelligence · Quick Guide
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}