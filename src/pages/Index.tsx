import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Shield, ArrowLeft, Zap, Eye, EyeOff, Server, Lock,
  ShoppingCart, UtensilsCrossed, Truck, Shirt, Mail, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useState } from "react";

const trustPartners = [
  "Supabase", "Intel", "Google Cloud (Dammam)", "Hikvision", "Dahua", "EZVIZ",
  "Axis Communications", "Alinma Bank", "SDAIA", "CITC", "NDMO",
];

export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const Arrow = ArrowLeft;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const verticals = [
    { key: "retail", icon: ShoppingCart, color: "text-primary" },
    { key: "fnb", icon: UtensilsCrossed, color: "text-gold" },
    { key: "logistics", icon: Truck, color: "text-emerald" },
    { key: "laundry", icon: Shirt, color: "text-accent" },
  ];

  const privacyCards = [
    { key: "no_eyes", icon: EyeOff, glow: "glow-blue" },
    { key: "volatile", icon: Zap, glow: "glow-gold" },
    { key: "residency", icon: Server, glow: "glow-emerald" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-background overflow-hidden relative">
      {/* Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[300px] sm:h-[500px] bg-primary/5 rounded-full blur-[200px] pointer-events-none" />

      {/* Nav */}
      <nav className="glass-strong sticky top-0 z-50 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-foreground tracking-tight font-arabic">{t("brand")}</span>
              <span className="text-[8px] sm:text-[10px] text-muted-foreground font-mono tracking-widest hidden sm:block">{t("brand_sub")}</span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground text-sm font-arabic">
              {t("nav.signin")}
            </Button>
            <Button onClick={() => navigate("/onboarding")} className="bg-primary text-primary-foreground text-sm h-9 font-arabic">
              {t("nav.getStarted")}
            </Button>
          </div>

          {/* Mobile nav toggle */}
          <button className="sm:hidden p-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="sm:hidden border-t border-border px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <LanguageSwitcher />
            </div>
            <Button variant="ghost" onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} className="w-full justify-center text-muted-foreground hover:text-foreground text-sm font-arabic">
              {t("nav.signin")}
            </Button>
            <Button onClick={() => { navigate("/onboarding"); setMobileMenuOpen(false); }} className="w-full bg-primary text-primary-foreground text-sm h-9 font-arabic">
              {t("nav.getStarted")}
            </Button>
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-24 pb-12 sm:pb-20 text-center relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4 sm:mb-6">
            <Eye className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] sm:text-xs font-semibold text-accent tracking-widest font-arabic">
              {t("hero.badge")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-foreground leading-tight max-w-3xl mx-auto font-arabic">
            {t("hero.title1")}{" "}
            <span className="text-gradient-blue">{t("hero.title2")}</span>
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground mt-3 sm:mt-5 max-w-xl mx-auto font-arabic px-2">
            {t("hero.desc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 sm:mt-8 px-4 sm:px-0">
            <Button onClick={() => navigate("/onboarding")} size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground h-11 sm:h-12 px-8 text-sm font-semibold glow-blue font-arabic">
              {t("hero.cta")} <Arrow className="w-4 h-4 ms-2" />
            </Button>
            <Button onClick={() => navigate("/login")} variant="outline" size="lg" className="w-full sm:w-auto border-border text-foreground hover:bg-secondary h-11 sm:h-12 px-8 text-sm font-arabic">
              {t("hero.demo")}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Zero-Sight Badge */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex justify-center">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-emerald/10 border-2 border-emerald/30 glow-emerald">
            <EyeOff className="w-5 h-5 sm:w-6 sm:h-6 text-emerald" />
            <div className="text-center">
              <p className="text-xs sm:text-sm font-bold text-emerald font-arabic">لا تقع عليها عين بشرية</p>
              <p className="text-[9px] sm:text-[10px] text-emerald/70 font-arabic">نظام مؤتمت بالكامل — صفر رؤية بشرية</p>
            </div>
            <EyeOff className="w-5 h-5 sm:w-6 sm:h-6 text-emerald hidden sm:block" />
          </div>
        </motion.div>
      </section>

      {/* Trust Bar Marquee */}
      <section className="border-y border-border py-4 overflow-hidden relative">
        <div className="absolute inset-y-0 start-0 w-10 sm:w-20 z-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, transparent, hsl(var(--background)))' }} />
        <div className="absolute inset-y-0 end-0 w-10 sm:w-20 z-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to left, transparent, hsl(var(--background)))' }} />
        <div className="flex animate-marquee gap-8 sm:gap-12 whitespace-nowrap">
          {[...trustPartners, ...trustPartners].map((p, i) => (
            <span key={i} className="text-[10px] sm:text-xs font-mono text-muted-foreground/60 uppercase tracking-widest flex-shrink-0">
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* Business Verticals */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground font-arabic">{t("verticals.title")}</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 sm:mt-3 font-arabic">{t("verticals.subtitle")}</p>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {verticals.map((v, i) => (
            <motion.div
              key={v.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl bg-card border border-border p-4 sm:p-6 hover:border-primary/20 transition-all group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:glow-blue transition-all">
                <v.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${v.color}`} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground font-arabic">{t(`verticals.${v.key}.title`)}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-1.5 leading-relaxed font-arabic">{t(`verticals.${v.key}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Privacy Shield */}
      <section className="border-y border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald/10 border border-emerald/20 mb-4">
              <Lock className="w-3.5 h-3.5 text-emerald" />
              <span className="text-[10px] sm:text-xs font-semibold text-emerald tracking-widest font-arabic">{t("privacy_shield.badge")}</span>
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground font-arabic">{t("privacy_shield.title")}</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 sm:mt-3 font-arabic">{t("privacy_shield.subtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {privacyCards.map((c, i) => (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`rounded-xl bg-card border border-border p-5 sm:p-8 text-center hover:${c.glow} transition-all`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4 sm:mb-5">
                  <c.icon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground mb-2 font-arabic">{t(`privacy_shield.${c.key}.title`)}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-arabic">{t(`privacy_shield.${c.key}.desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground font-arabic">{t("brand")}</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-xs text-muted-foreground">
              <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors font-arabic">{t("nav.terms")}</button>
              <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors font-arabic">{t("nav.privacy")}</button>
              <button onClick={() => navigate("/sla")} className="hover:text-foreground transition-colors font-arabic">{t("nav.sla")}</button>
            </div>
          </div>

          {/* Contact & CR */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border flex flex-col items-center gap-3 sm:gap-4 text-center">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <a href="mailto:splittechsa@outlook.com" className="hover:text-foreground transition-colors font-mono text-[11px] sm:text-xs">splittechsa@outlook.com</a>
            </div>
            <div className="text-xs text-muted-foreground font-arabic">
              <span className="text-muted-foreground/60">{t("footer.cr")}:</span>{" "}
              <span className="text-muted-foreground/40 font-mono">{t("footer.cr_number")}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">
              🔒 {t("footer.tagline")}
            </p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground/50 mt-2 font-arabic">
              © {new Date().getFullYear()} Split Intelligence · {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
