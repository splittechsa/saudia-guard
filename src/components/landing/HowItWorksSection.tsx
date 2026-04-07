import { motion } from "framer-motion";
import { Camera, LayoutGrid, Brain, Send } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "الكاميرات الموجودة",
    desc: "لا تحتاج كاميرات جديدة. نظامنا يعمل مع كاميراتك الحالية عبر بروتوكول RTSP.",
  },
  {
    icon: LayoutGrid,
    title: "التقاط ذكي",
    desc: "يلتقط المحرك صورة كل دقيقة ويجمع 10 صور في تحليل واحد — مما يقلل التكلفة بنسبة 90%.",
  },
  {
    icon: Brain,
    title: "تحليل بالذكاء الاصطناعي",
    desc: "نموذج Gemini من Google يحلل الصور ويجيب على أسئلتك المخصصة — بالعربية — من سيرفرات الدمام.",
  },
  {
    icon: Send,
    title: "تقريرك فوراً",
    desc: "تصل النتائج إلى لوحة التحكم خلال ثوانٍ. واتساب اختياري.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="border-y border-border bg-card/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">كيف يعمل ذكاء سبلت؟</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-xs font-mono text-primary/60 mb-2">0{i + 1}</div>
              <h3 className="text-sm font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
