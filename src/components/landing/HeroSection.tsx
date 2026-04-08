import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Shield, Cpu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "50+", label: "منشأة تستخدم سبلت", icon: Globe },
  { value: "99.9%", label: "وقت تشغيل مضمون", icon: Shield },
  { value: "<3s", label: "زمن التحليل", icon: Cpu },
];

export default function HeroSection() {
  const navigate = useNavigate();

  const scrollToDemo = () => {
    document.getElementById("demo-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-20 sm:pb-28 text-center">
      {/* Ambient glows */}
      <div className="absolute top-[-160px] left-1/2 -translate-x-1/2 w-[800px] sm:w-[1200px] h-[700px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, hsl(72 100% 55% / 0.03) 0%, transparent 60%)' }} />
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(160 84% 39% / 0.02) 0%, transparent 60%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-primary/10 bg-primary/[0.03] mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
          <span className="text-[11px] text-primary/80 font-medium tracking-wide">مدعوم بالذكاء الاصطناعي من Google</span>
        </motion.div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-[3.5rem] lg:text-[4.2rem] font-bold text-foreground leading-[1.12] max-w-4xl mx-auto tracking-tight-ar">
          عين الذكاء على منشأتك.{" "}
          <br className="hidden sm:block" />
          <span className="text-gradient-lime">كاميراتك تتحول لمدير تشغيل لا ينام.</span>
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-base sm:text-lg text-muted-foreground mt-7 max-w-2xl mx-auto leading-relaxed px-2"
        >
          نظام رقابة تشغيلية ذكي يحلل كاميرات المراقبة الحالية — يرصد، يحلل، ويقدم تقارير فورية بالعربية من سيرفرات داخل المملكة.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 px-4 sm:px-0"
        >
          <Button
            onClick={() => navigate("/signup")}
            size="lg"
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-10 text-[14px] font-semibold btn-neon transition-all duration-300 rounded-xl"
          >
            ابدأ تجربتك المجانية
            <ArrowLeft className="w-4 h-4 ms-2" />
          </Button>
          <Button
            onClick={scrollToDemo}
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03] h-12 px-8 text-[14px] group rounded-xl"
          >
            <Play className="w-3.5 h-3.5 me-2 text-primary group-hover:scale-110 transition-transform" />
            شاهد كيف يعمل
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 sm:mt-20 flex items-center justify-center gap-6 sm:gap-12 flex-wrap"
        >
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-foreground/[0.05] border border-border/20 flex items-center justify-center group-hover:border-primary/20 transition-colors">
                <s.icon className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-right">
                <p className="text-lg sm:text-xl font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Powered by */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-20 pt-8 border-t border-border/8"
      >
        <p className="text-[9px] text-muted-foreground/50 font-mono uppercase tracking-[0.3em] mb-5">TRUSTED TECHNOLOGY</p>
        <div className="flex items-center justify-center gap-8 sm:gap-14 flex-wrap">
          {["Google Cloud", "Vertex AI", "Hikvision", "Dahua", "EZVIZ", "Intel"].map((p) => (
            <span key={p} className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors duration-300 cursor-default">{p}</span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
