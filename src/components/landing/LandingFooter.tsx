import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import splitLogo from "@/assets/split-logo-icon.png";

export default function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src={splitLogo} alt="Split Tech" className="w-7 h-7" />
            <div>
              <span className="text-sm font-bold text-foreground">Split Tech</span>
              <p className="text-[9px] text-muted-foreground">رقابة ذكية. قرارات أذكى.</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">الخصوصية</button>
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">الشروط</button>
            <button onClick={() => navigate("/sla")} className="hover:text-foreground transition-colors">الدعم</button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <a href="mailto:splittechsa@outlook.com" className="hover:text-foreground transition-colors font-mono text-xs">splittechsa@outlook.com</a>
          </div>
          <p className="text-[10px] text-muted-foreground/50">
            © {new Date().getFullYear()} مؤسسة سبلت تيك لتقنية المعلومات
          </p>
        </div>
      </div>
    </footer>
  );
}
