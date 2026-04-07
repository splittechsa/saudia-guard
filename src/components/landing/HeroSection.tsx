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
    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-20 sm:pb-28 text-center">
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[500px] bg-primary/[0.03] rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-[200px] h-[200px] bg-primary/[0.05] rounded-full blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/[0.05] mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
          <span className="text-xs text-primary font-medium">مدعوم بالذكاء الاصطناعي من Google</span>
        </motion.div>

        <h1 className="text-3xl sm:text-5xl md:text-[3.5rem] lg:text-[4rem] font-bold text-foreground leading-[1.15] max-w-4xl mx-auto">
          عين الذكاء على منشأتك.{" "}
          <br className="hidden sm:block" />
          <span className="text-gradient-lime">Split Tech تحول كاميراتك لمدير تشغيل لا ينام.</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed px-2">
          ذكاء سبلت يحوّل كاميرات المراقبة الموجودة لديك إلى نظام رقابة تشغيلية ذكي — يحلل، يرصد، ويقدم لك تقارير فورية بالعربية من سيرفرات داخل المملكة.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 px-4 sm:px-0">
          <Button
            onClick={() => navigate("/signup")}
            size="lg"
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-13 px-10 text-sm font-semibold glow-lime-strong transition-all duration-300 hover:scale-[1.02]"
          >
            ابدأ مجاناً <ArrowLeft className="w-4 h-4 ms-2" />
          </Button>
          <Button
            onClick={scrollToDemo}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-border/50 text-foreground hover:bg-secondary/50 h-13 px-10 text-sm group"
          >
            <Play className="w-3.5 h-3.5 me-2 text-primary group-hover:scale-110 transition-transform" />
            شاهد كيف يعمل
          </Button>
        </div>
      </motion.div>

      {/* Trust logos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-20 pt-8 border-t border-border/20"
      >
        <p className="text-[10px] text-muted-foreground/40 font-mono uppercase tracking-[0.2em] mb-4">Powered by</p>
        <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap text-muted-foreground/30">
          {["Google Cloud", "Vertex AI", "Hikvision", "Dahua", "EZVIZ", "Intel"].map((p) => (
            <span key={p} className="text-[10px] sm:text-xs font-mono uppercase tracking-widest hover:text-muted-foreground/50 transition-colors cursor-default">{p}</span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
