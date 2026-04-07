import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const navigate = useNavigate();

  const scrollToDemo = () => {
    document.getElementById("demo-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-28 pb-16 sm:pb-24 text-center relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] sm:w-[800px] h-[400px] bg-primary/5 rounded-full blur-[200px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight max-w-3xl mx-auto">
          كاميراتك تعمل.{" "}
          <span className="text-gradient-lime">هل تعمل لصالحك؟</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground mt-5 max-w-xl mx-auto leading-relaxed px-2">
          ذكاء سبلت يحوّل كاميرات المراقبة الموجودة لديك إلى نظام رقابة تشغيلية ذكي يعمل على مدار الساعة.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 px-4 sm:px-0">
          <Button onClick={() => navigate("/signup")} size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-sm font-semibold glow-lime">
            ابدأ مجاناً <ArrowLeft className="w-4 h-4 ms-2" />
          </Button>
          <Button onClick={scrollToDemo} variant="outline" size="lg" className="w-full sm:w-auto border-border text-foreground hover:bg-secondary h-12 px-8 text-sm">
            شاهد كيف يعمل
          </Button>
        </div>
      </motion.div>

      {/* Trust logos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-14 flex items-center justify-center gap-6 sm:gap-10 flex-wrap text-muted-foreground/40"
      >
        {["Google Cloud", "Supabase", "Hikvision", "Dahua", "EZVIZ", "Intel"].map((p) => (
          <span key={p} className="text-[10px] sm:text-xs font-mono uppercase tracking-widest">{p}</span>
        ))}
      </motion.div>
    </section>
  );
}
