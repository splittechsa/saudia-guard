import { motion } from "framer-motion";
import { Eye, Users, SprayCan } from "lucide-react";

const problems = [
  {
    icon: Users,
    title: "لا تعرف كم زبوناً دخل اليوم",
    desc: "تقضي يومك في العمل لكن لا تملك أرقاماً حقيقية عن حركة العملاء.",
  },
  {
    icon: SprayCan,
    title: "لا تعرف إن كانت أرضيتك نظيفة عند الفحص",
    desc: "النظافة مهمة لسمعتك — لكن لا أحد يراقبها بشكل مستمر.",
  },
  {
    icon: Eye,
    title: "لا تعرف إن كان موظفك في مكانه",
    desc: "الانضباط يتراجع حين يغيب المراقب. والكاميرا وحدها لا تكفي.",
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

export default function ProblemSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight-ar">
          ماذا يحدث في متجرك <span className="text-gradient-lime">الآن؟</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
          كاميراتك تسجل 24 ساعة. لكن من يشاهد؟
        </p>
      </motion.div>

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
            className="group relative rounded-xl border border-border/30 bg-card/40 p-6 sm:p-7 hover:border-primary/20 transition-all duration-500 hover-glow border-glow-card"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/[0.06] border border-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary/[0.1] transition-colors duration-300">
              <p.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
