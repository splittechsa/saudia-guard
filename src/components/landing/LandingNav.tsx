import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import splitLogo from "@/assets/split-logo-icon.png";

export default function LandingNav() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
          <img src={splitLogo} alt="Split Tech" className="w-7 h-7" />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-foreground tracking-tight">Split Tech</span>
            <span className="text-[9px] text-muted-foreground font-mono tracking-widest">ذكاء سبلت</span>
          </div>
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground text-sm">
            تسجيل الدخول
          </Button>
          <Button onClick={() => navigate("/signup")} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9">
            ابدأ مجاناً
          </Button>
        </div>

        <button className="sm:hidden p-2 text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="sm:hidden border-t border-border px-4 py-3 space-y-2">
          <Button variant="ghost" onClick={() => { navigate("/login"); setOpen(false); }} className="w-full justify-center text-muted-foreground text-sm">
            تسجيل الدخول
          </Button>
          <Button onClick={() => { navigate("/signup"); setOpen(false); }} className="w-full bg-primary text-primary-foreground text-sm h-9">
            ابدأ مجاناً
          </Button>
        </motion.div>
      )}
    </nav>
  );
}
