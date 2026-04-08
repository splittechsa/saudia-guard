import { motion } from "framer-motion";
import { Eye, Users, SprayCan, AlertTriangle } from "lucide-react";

const problems = [
  {
    icon: Users,
    title: "لا تعرف كم زبوناً دخل اليوم",
    desc: "تقضي يومك في العمل لكن لا تملك أرقاماً حقيقية عن حركة العملاء.",
    stat: "73%",
    statLabel: "من أصحاب المحلات لا يملكون بيانات دخول",
  },
  {
    icon: SprayCan,
    title: "لا تعرف إن كانت أرضيتك نظيفة",
    desc: "النظافة مهمة لسمعتك — لكن لا أحد يراقبها بشكل مستمر.",
    stat: "45%",
    statLabel: "من الشكاوى بسبب النظافة",
  },
  {
    icon: Eye,
    title: "لا تعرف إن كان موظفك في مكانه",
    desc: "الانضباط يتراجع حين يغيب المراقب. والكاميرا وحدها لا تكفي.",
    stat: "60%",
    statLabel: "تحسّن في الانضباط مع سبلت",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export default function ProblemSection() {
  return (
    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-destructive/15 bg-destructive/[0.04] mb-5">
          <AlertTriangle className="w-3 h-3 text-destructive/60" />
          <span className="text-[10px] text-destructive/60 font-mono uppercase tracking-wider">المشكلة</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight-ar">
          ماذا يحدث في متجرك <span className="text-gradient-lime">الآن؟</span>
        </h2>
        <p className="text-sm text-muted-foreground/50 mt-3 max-w-lg mx-auto">
          كاميراتك تسجل 24 ساعة. لكن من يشاهد؟
        </p>
      </motion.div>

      {/* Cards */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="grid md:grid-cols-3 gap-4 sm:gap-5"
      >
        {problems.map((p, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            className="group relative rounded-2xl border border-border/15 bg-card/30 p-6 sm:p-7 hover:border-primary/15 transition-all duration-500 hover-glow overflow-hidden"
          >
            {/* Background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-primary/[0.05] border border-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary/[0.08] transition-colors duration-300">
                <p.icon className="w-5 h-5 text-primary/70" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{p.title}</h3>
              <p className="text-[13px] text-muted-foreground/50 leading-relaxed mb-5">{p.desc}</p>

              {/* Stat */}
              <div className="pt-4 border-t border-border/8 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary/80">{p.stat}</span>
                <span className="text-[11px] text-muted-foreground/30">{p.statLabel}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
