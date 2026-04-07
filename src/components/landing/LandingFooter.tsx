import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import splitLogo from "@/assets/split-logo-icon.png";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border/10 bg-card/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <img src={splitLogo} alt="Split Tech" className="w-6 h-6 opacity-80" />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-foreground/80">Split Tech</span>
                <span className="text-[9px] text-muted-foreground/40 font-mono">ذكاء سبلت</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground/50 leading-relaxed">
              رقابة ذكية. قرارات أذكى.
            </p>
            <p className="text-xs text-muted-foreground/30 mt-3">
              info@splittech.sa
            </p>
          </div>

          <div className="flex gap-10 text-sm">
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono text-muted-foreground/25 uppercase tracking-[0.2em]">قانوني</h4>
              <Link to="/privacy" className="block text-muted-foreground/40 hover:text-foreground/70 transition-colors duration-200">الخصوصية</Link>
              <Link to="/terms" className="block text-muted-foreground/40 hover:text-foreground/70 transition-colors duration-200">الشروط</Link>
              <Link to="/sla" className="block text-muted-foreground/40 hover:text-foreground/70 transition-colors duration-200">اتفاقية الخدمة</Link>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono text-muted-foreground/25 uppercase tracking-[0.2em]">الدعم</h4>
              <Link to="/login" className="block text-muted-foreground/40 hover:text-foreground/70 transition-colors duration-200">تسجيل الدخول</Link>
              <Link to="/signup" className="block text-muted-foreground/40 hover:text-foreground/70 transition-colors duration-200">إنشاء حساب</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground/25">
            &copy; {new Date().getFullYear()} مؤسسة سبلت تيك لتقنية المعلومات. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse-live" />
              <span className="text-[10px] font-mono text-emerald/60">All Systems Operational</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/15 tracking-wider">DAMMAM — KSA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
