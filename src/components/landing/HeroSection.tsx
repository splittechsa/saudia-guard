import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const navigate = useNavigate();

  const scrollToDemo = () => {
    document.getElementById("demo-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-36 pb-24 sm:pb-32 text-center">
      {/* Radial glow — brand lime */}
      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, hsl(72 100% 55% / 0.04) 0%, transparent 70%)' }} />
      <div className="absolute top-32 right-1/3 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(72 100% 55% / 0.03) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/15 bg-primary/[0.04] mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
          <span className="text-[11px] text-primary font-medium tracking-wide">مدعوم بالذكاء الاصطناعي من Google</span>
        </motion.div>

        <h1 className="text-3xl sm:text-5xl md:text-[3.5rem] lg:text-[4.2rem] font-bold text-foreground leading-[1.12] max-w-4xl mx-auto tracking-tight-ar">
          عين الذكاء على منشأتك.{" "}
          <br className="hidden sm:block" />
          <span className="text-gradient-lime">Split Tech تحول كاميراتك لمدير تشغيل لا ينام.</span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-base sm:text-lg text-muted-foreground mt-7 max-w-2xl mx-auto leading-relaxed px-2"
        >
          ذكاء سبلت يحوّل كاميرات المراقبة الموجودة لديك إلى نظام رقابة تشغيلية ذكي — يحلل، يرصد، ويقدم لك تقارير فورية بالعربية من سيرفرات داخل المملكة.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 px-4 sm:px-0"
        >
          <Button
            onClick={() => navigate("/signup")}
            size="lg"
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-13 px-10 text-sm font-semibold btn-neon transition-all duration-300"
          >
            ابدأ مجاناً <ArrowLeft className="w-4 h-4 ms-2" />
          </Button>
          <Button
            onClick={scrollToDemo}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-border/40 text-foreground hover:bg-secondary/50 h-13 px-10 text-sm group"
          >
            <Play className="w-3.5 h-3.5 me-2 text-primary group-hover:scale-110 transition-transform" />
            شاهد كيف يعمل
          </Button>
        </motion.div>
      </motion.div>

      {/* Trust logos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-24 pt-8 border-t border-border/10"
      >
        <p className="text-[10px] text-muted-foreground/30 font-mono uppercase tracking-[0.25em] mb-5">Powered by</p>
        <div className="flex items-center justify-center gap-8 sm:gap-14 flex-wrap">
          {["Google Cloud", "Vertex AI", "Hikvision", "Dahua", "EZVIZ", "Intel"].map((p) => (
            <span key={p} className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground/20 hover:text-muted-foreground/40 transition-colors duration-300 cursor-default">{p}</span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
