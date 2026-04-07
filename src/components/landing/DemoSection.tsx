import { motion } from "framer-motion";
import { Clock, Activity } from "lucide-react";

const auditResult = {
  time: "10:30",
  store: "مغسلة النخبة — الرياض",
  questions: [
    { q: "هل الموظفون في أماكنهم؟", a: "نعم", detail: "تواجد الموظفون في محطات العمل طوال فترة التحليل.", metric: null },
    { q: "هل المكان نظيف؟", a: "نعم", detail: "المنطقة بدت نظيفة بشكل عام خلال هذه الجولة.", metric: null },
    { q: "كم سيارة دخلت؟", a: "4", detail: "لوحظ دخول 4 سيارات خلال هذه الفترة.", metric: [2, 5, 3, 4, 1, 4] },
  ],
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="sparkline-bar">
      {data.map((v, i) => (
        <span key={i} style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
}

export default function DemoSection() {
  return (
    <section id="demo-section" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight-ar">
          شاهد <span className="text-gradient-lime">نتيجة حقيقية</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-3">هكذا تبدو تقاريرك في لوحة التحكم</p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="max-w-xl mx-auto rounded-2xl glass overflow-hidden border-glow-card"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="px-6 py-4 border-b border-border/20 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-mono text-muted-foreground/60 tracking-wide">[{auditResult.time}] SYSTEM_AUDIT_SUCCESS</p>
            </div>
            <p className="text-sm font-semibold text-foreground">{auditResult.store}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/[0.08] border border-emerald/15">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse-live" />
            <span className="text-[10px] text-emerald font-mono uppercase tracking-wider">LIVE</span>
          </div>
        </motion.div>

        {/* Questions */}
        <div className="divide-y divide-border/10">
          {auditResult.questions.map((item, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="px-6 py-4 group hover:bg-primary/[0.02] transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-foreground">{item.q}</p>
                <div className="flex items-center gap-2">
                  {item.metric && <Sparkline data={item.metric} />}
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    item.a === "نعم" ? "text-emerald bg-emerald/[0.08]" : "text-primary bg-primary/[0.08]"
                  }`}>
                    {item.a}
                  </span>
                </div>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{item.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="px-6 py-3 border-t border-border/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-primary/40" />
            <span className="text-[10px] font-mono text-muted-foreground/40">AI_CONFIDENCE: 97.2%</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/30">GEMINI_2.5_FLASH</span>
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs text-muted-foreground/40 mt-8"
      >
        هذا ما سيراه صاحب المغسلة كل 10 دقائق — تلقائياً.
      </motion.p>
    </section>
  );
}
