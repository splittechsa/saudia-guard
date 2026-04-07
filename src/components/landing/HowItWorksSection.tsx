import { motion } from "framer-motion";
import { Camera, Grid3X3, Brain, Zap } from "lucide-react";

const steps = [
  {
    icon: Camera,
    num: "01",
    title: "الكاميرات الموجودة",
    text: "لا تحتاج كاميرات جديدة. نظامنا يعمل مع كاميراتك الحالية عبر بروتوكول RTSP.",
  },
  {
    icon: Grid3X3,
    num: "02",
    title: "التقاط ذكي",
    text: "يلتقط المحرك صورة كل دقيقة ويجمع 10 صور في تحليل واحد — مما يقلل التكلفة بنسبة 90%.",
  },
  {
    icon: Brain,
    num: "03",
    title: "تحليل بالذكاء الاصطناعي",
    text: "نموذج Gemini من Google يحلل الصور ويجيب على أسئلتك المخصصة — بالعربية — من سيرفرات الدمام.",
  },
  {
    icon: Zap,
    num: "04",
    title: "تقريرك فوراً",
    text: "تصل النتائج إلى لوحة التحكم خلال ثوانٍ. واتساب اختياري.",
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
    <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight-ar">
          كيف يعمل <span className="text-gradient-lime">ذكاء سبلت؟</span>
        </h2>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        {steps.map((s, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            className="group relative rounded-xl border border-border/20 bg-card/30 p-6 hover:border-primary/15 transition-all duration-500 hover-glow border-glow-card"
          >
            <span className="absolute top-4 left-4 text-[10px] font-mono text-primary/30 font-bold">{s.num}</span>

            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/8 to-primary/[0.02] border border-primary/8 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
              <s.icon className="w-5 h-5 text-primary" />
            </div>

            <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>

            {i < steps.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -left-3 w-6 h-px bg-gradient-to-l from-primary/15 to-transparent" />
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
