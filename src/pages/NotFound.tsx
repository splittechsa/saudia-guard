import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowRight, SearchX, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // تسجيل الخطأ في السيرفر أو اللوق لمتابعته لاحقاً
    console.error("404 Error: Access attempt to:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background carbon-grid relative overflow-hidden" dir="rtl">
      {/* تأثيرات الإضاءة لتوحيد الهوية مع صفحة الدخول */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center px-6"
      >
        {/* أيقونة تعبيرية */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-secondary border border-border mb-8 relative">
          <SearchX className="w-10 h-10 text-muted-foreground/50" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-3xl border-t-2 border-primary/30"
          />
        </div>

        <h1 className="mb-4 text-7xl font-black text-foreground tracking-tighter font-mono opacity-20">404</h1>
        
        <h2 className="mb-2 text-2xl font-bold text-foreground font-arabic">عفواً، المسار غير موجود</h2>
        <p className="mb-10 text-muted-foreground font-arabic max-w-sm mx-auto">
          يبدو أن الرابط الذي تحاول الوصول إليه غير موجود في نظام سبلت تيك، أو تم نقله لمكان آخر.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            onClick={() => navigate("/")} 
            className="w-full sm:w-auto h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl gap-2 shadow-lg shadow-primary/20"
          >
            <Home className="w-4 h-4" /> العودة للرئيسية
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.location.href = "mailto:info@splittech.sa"}
            className="w-full sm:w-auto h-12 px-8 border-border hover:bg-secondary rounded-xl gap-2 font-arabic"
          >
            <HelpCircle className="w-4 h-4" /> الدعم الفني
          </Button>
        </div>

        {/* كود المسار التائه للجمالية التقنية */}
        <div className="mt-16 p-3 bg-secondary/30 rounded-lg inline-block border border-border/50">
          <code className="text-[10px] text-muted-foreground font-mono">
            REQUEST_PATH: {location.pathname} | STATUS: NOT_FOUND
          </code>
        </div>

        <p className="mt-8 text-[10px] text-muted-foreground/40 font-mono tracking-widest uppercase">
          SplitTech AI Audit Engine · Jeddah HQ
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;