import { motion } from "framer-motion";

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
    <section id="demo-section" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground">شاهد نتيجة حقيقية</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-lg mx-auto rounded-xl bg-card border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-bold text-foreground">تقرير جولة التدقيق — {auditResult.time}</p>
          <p className="text-xs text-muted-foreground mt-1">{auditResult.store}</p>
        </div>
        <div className="divide-y divide-border">
          {auditResult.questions.map((item, i) => (
            <div key={i} className="px-5 py-4">
              <p className="text-sm font-semibold text-foreground mb-1.5">{item.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        هذا ما سيراه صاحب المغسلة كل 10 دقائق — تلقائياً.
      </p>
    </section>
  );
}
