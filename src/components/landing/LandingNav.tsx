import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border/20 bg-background/70 backdrop-blur-2xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Logo */}
        <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
          <div className="relative">
            <img
              src={splitLogo}
              alt="Split Tech"
              className="w-8 h-8 transition-all duration-300 group-hover:scale-110"
            />
            <div className="absolute -inset-1 bg-primary/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold text-foreground tracking-tight">Split Tech</span>
            <span className="text-[8px] text-muted-foreground/40 font-mono tracking-[0.2em] mt-0.5">INTELLIGENT AUDITING</span>
          </div>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="relative px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-lg hover:bg-foreground/[0.04] group"
            >
              {link.label}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-px bg-primary group-hover:w-4 transition-all duration-300" />
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="text-muted-foreground hover:text-foreground text-[13px] h-9 px-4"
          >
            تسجيل الدخول
          </Button>
          <Button
            onClick={() => navigate("/signup")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-[13px] h-9 px-5 font-semibold btn-neon rounded-lg"
          >
            ابدأ مجاناً
            <ArrowLeft className="w-3.5 h-3.5 ms-1.5" />
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-border/10 bg-background/95 backdrop-blur-2xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className="block w-full text-right text-[14px] text-muted-foreground py-3 px-3 rounded-lg hover:bg-foreground/[0.03] hover:text-foreground transition-all"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-3 mt-2 border-t border-border/10 space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => { navigate("/login"); setOpen(false); }}
                  className="w-full justify-center text-muted-foreground text-[13px] h-10"
                >
                  تسجيل الدخول
                </Button>
                <Button
                  onClick={() => { navigate("/signup"); setOpen(false); }}
                  className="w-full bg-primary text-primary-foreground text-[13px] h-10 font-semibold btn-neon"
                >
                  ابدأ مجاناً
                  <ArrowLeft className="w-3.5 h-3.5 ms-1.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
