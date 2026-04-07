import { motion } from "framer-motion";
import { EyeOff, Server, Zap } from "lucide-react";

const badges = [
  { icon: EyeOff, title: "لا عيون بشرية", desc: "الصور تُحلل بالذكاء الاصطناعي وتُحذف فوراً" },
  { icon: Server, title: "سيرفرات الدمام", desc: "جميع البيانات داخل المملكة العربية السعودية" },
  { icon: Zap, title: "تحليل متطاير", desc: "لا تخزين للصور، فقط النص" },
];

export default function PrivacySection() {
  return (
    <section className="border-y border-border bg-card/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">بياناتك لا تغادر المملكة</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {badges.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="rounded-xl bg-card border border-border p-6 sm:p-8 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center mx-auto mb-4">
                <b.icon className="w-6 h-6 text-emerald" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-2">{b.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
