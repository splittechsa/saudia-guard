import { motion } from "framer-motion";
import { Clock, CheckCircle2 } from "lucide-react";

const auditResult = {
  time: "10:30 صباحاً",
  store: "مغسلة النخبة — الرياض",
  questions: [
    { q: "هل الموظفون في أماكنهم؟", a: "نعم، تواجد الموظفون في محطات العمل طوال فترة التحليل." },
    { q: "هل المكان نظيف؟", a: "المنطقة بدت نظيفة بشكل عام خلال هذه الجولة." },
    { q: "كم سيارة دخلت؟", a: "لوحظ دخول 4 سيارات خلال هذه الفترة." },
  ],
};

export default function DemoSection() {
  return (
    <section id="demo-section" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
          شاهد <span className="text-gradient-lime">نتيجة حقيقية</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-3">هكذا تبدو تقاريرك في لوحة التحكم</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-xl mx-auto rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden hover-glow"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <p className="text-sm font-bold text-foreground">تقرير جولة التدقيق — {auditResult.time}</p>
            </div>
            <p className="text-xs text-muted-foreground">{auditResult.store}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald/10 border border-emerald/20">
            <CheckCircle2 className="w-3 h-3 text-emerald" />
            <span className="text-[10px] text-emerald font-medium">مكتمل</span>
          </div>
        </div>

        {/* Questions */}
        <div className="divide-y divide-border/20">
          {auditResult.questions.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="px-6 py-4 group hover:bg-primary/[0.02] transition-colors"
            >
              <p className="text-sm font-semibold text-foreground mb-1.5">{item.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-muted-foreground mt-8"
      >
        هذا ما سيراه صاحب المغسلة كل 10 دقائق — تلقائياً.
      </motion.p>
    </section>
  );
}
