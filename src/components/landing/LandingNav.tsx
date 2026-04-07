import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import splitLogo from "@/assets/split-logo-icon.png";

const navLinks = [
  { label: "المنتج", href: "#how-it-works" },
  { label: "الأسعار", href: "#pricing" },
  { label: "الخصوصية", href: "#privacy" },
  { label: "تجربة حية", href: "#demo-section" },
];

export default function LandingNav() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
          <img src={splitLogo} alt="Split Tech" className="w-7 h-7 transition-transform group-hover:scale-110" />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-foreground tracking-tight">Split Tech</span>
            <span className="text-[9px] text-muted-foreground font-mono tracking-widest">ذكاء سبلت</span>
          </div>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground text-sm">
            تسجيل الدخول
          </Button>
          <Button onClick={() => navigate("/signup")} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 glow-lime">
            ابدأ مجاناً
          </Button>
        </div>

        <button className="sm:hidden p-2 text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="sm:hidden border-t border-border/30 px-4 py-3 space-y-2 bg-background/95 backdrop-blur-xl">
          {navLinks.map((link) => (
            <button key={link.label} onClick={() => scrollTo(link.href)} className="block w-full text-right text-sm text-muted-foreground py-2 hover:text-foreground transition-colors">
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-border/30 space-y-2">
            <Button variant="ghost" onClick={() => { navigate("/login"); setOpen(false); }} className="w-full justify-center text-muted-foreground text-sm">
              تسجيل الدخول
            </Button>
            <Button onClick={() => { navigate("/signup"); setOpen(false); }} className="w-full bg-primary text-primary-foreground text-sm h-9">
              ابدأ مجاناً
            </Button>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
