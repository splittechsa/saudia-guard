import { Link } from "react-router-dom";
import splitLogo from "@/assets/split-logo-icon.png";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border/20 bg-card/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <img src={splitLogo} alt="Split Tech" className="w-7 h-7" />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-foreground">Split Tech</span>
                <span className="text-[9px] text-muted-foreground font-mono">ذكاء سبلت</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              رقابة ذكية. قرارات أذكى.
            </p>
            <p className="text-xs text-muted-foreground/50 mt-3">
              info@splittech.sa
            </p>
          </div>

          <div className="flex gap-10 text-sm">
            <div className="space-y-3">
              <h4 className="text-xs font-mono text-muted-foreground/40 uppercase tracking-widest">قانوني</h4>
              <Link to="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">الخصوصية</Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">الشروط</Link>
              <Link to="/sla" className="block text-muted-foreground hover:text-foreground transition-colors">اتفاقية الخدمة</Link>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-mono text-muted-foreground/40 uppercase tracking-widest">الدعم</h4>
              <Link to="/login" className="block text-muted-foreground hover:text-foreground transition-colors">تسجيل الدخول</Link>
              <Link to="/signup" className="block text-muted-foreground hover:text-foreground transition-colors">إنشاء حساب</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground/40">
            © {new Date().getFullYear()} مؤسسة سبلت تيك لتقنية المعلومات. جميع الحقوق محفوظة.
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/25 tracking-wider">
            SPLIT TECH — INTELLIGENT OPERATIONS
          </p>
        </div>
      </div>
    </footer>
  );
}
