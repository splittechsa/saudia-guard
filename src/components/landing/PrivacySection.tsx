import { motion } from "framer-motion";
import { Shield, MapPin, Zap } from "lucide-react";

const badges = [
  {
    icon: Shield,
    title: "لا عيون بشرية",
    desc: "الصور تُحلل بالذكاء الاصطناعي وتُحذف فوراً. لا يوجد موظف بشري يشاهد أي صورة.",
  },
  {
    icon: MapPin,
    title: "سيرفرات الدمام",
    desc: "جميع البيانات تُعالج وتُخزن داخل المملكة العربية السعودية. منطقة me-central2.",
  },
  {
    icon: Zap,
    title: "تحليل متطاير",
    desc: "لا تخزين للصور — فقط النتائج النصية تبقى. الصور تُحذف بعد التحليل مباشرة.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function PrivacySection() {
  return (
    <section id="privacy" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight-ar">
          بياناتك <span className="text-gradient-lime">لا تغادر المملكة</span>
        </h2>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="grid md:grid-cols-3 gap-5"
      >
        {badges.map((b, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            className="rounded-2xl border border-border/20 bg-card/25 p-6 sm:p-7 text-center hover:border-emerald/15 transition-all duration-500 hover-glow group border-glow-card"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald/[0.06] border border-emerald/8 flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-transform duration-300">
              <b.icon className="w-6 h-6 text-emerald" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">{b.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
