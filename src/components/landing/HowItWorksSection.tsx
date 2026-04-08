import { motion } from "framer-motion";
import { Camera, Grid3X3, Brain, Zap } from "lucide-react";

const steps = [
  {
    icon: Camera,
    num: "01",
    title: "الكاميرات الموجودة",
    text: "لا تحتاج كاميرات جديدة. نظامنا يعمل مع كاميراتك الحالية عبر بروتوكول RTSP.",
    accent: "from-emerald/10 to-emerald/[0.02]",
  },
  {
    icon: Grid3X3,
    num: "02",
    title: "التقاط ذكي",
    text: "يلتقط المحرك صورة كل دقيقة ويجمع 10 صور في تحليل واحد — مما يقلل التكلفة بنسبة 90%.",
    accent: "from-tech-blue/10 to-tech-blue/[0.02]",
  },
  {
    icon: Brain,
    num: "03",
    title: "تحليل بالذكاء الاصطناعي",
    text: "نموذج Gemini من Google يحلل الصور ويجيب على أسئلتك — بالعربية — من سيرفرات الدمام.",
    accent: "from-primary/10 to-primary/[0.02]",
  },
  {
    icon: Zap,
    num: "04",
    title: "تقريرك فوراً",
    text: "تصل النتائج إلى لوحة التحكم خلال ثوانٍ. واتساب اختياري.",
    accent: "from-gold/10 to-gold/[0.02]",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      {/* Background pattern */}
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative text-center mb-16"
      >
        <span className="text-[10px] font-mono text-primary/40 uppercase tracking-[0.25em] mb-3 block">HOW IT WORKS</span>
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight-ar">
          كيف يعمل <span className="text-gradient-lime">ذكاء سبلت؟</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
          أربع خطوات فقط — من الكاميرا إلى التقرير
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        {/* Connection line */}
        <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-px bg-gradient-to-l from-transparent via-border/15 to-transparent" />

        {steps.map((s, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            className="group relative rounded-2xl border border-border/12 bg-card/20 p-6 hover:border-primary/12 transition-all duration-500 hover-glow overflow-hidden"
          >
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-b ${s.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative">
              {/* Step number */}
              <span className="text-[40px] font-bold text-foreground/[0.03] absolute -top-2 -right-1 font-mono select-none">{s.num}</span>

              <div className="w-12 h-12 rounded-xl bg-foreground/[0.05] border border-border/15 flex items-center justify-center mb-5 group-hover:border-primary/20 group-hover:bg-primary/[0.08] transition-all duration-300">
                <s.icon className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition-colors duration-300" />
              </div>

              <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
