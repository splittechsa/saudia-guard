import { motion } from "framer-motion";
import { Users, Sparkles, AlertTriangle } from "lucide-react";

const problems = [
  { text: "لا تعرف كم زبوناً دخل اليوم", icon: Users },
  { text: "لا تعرف إن كانت أرضيتك نظيفة عند الفحص", icon: Sparkles },
  { text: "لا تعرف إن كان موظفك في مكانه", icon: AlertTriangle },
];

export default function ProblemSection() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground">ماذا يحدث في متجرك الآن؟</h2>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {problems.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl bg-card border border-border p-6 hover:border-primary/30 transition-all group"
          >
            <p.icon className="w-5 h-5 text-primary mb-4" />
            <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">{p.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
