import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Shield, ArrowLeft, Zap, Eye, EyeOff, Server, Lock,
  ShoppingCart, UtensilsCrossed, Truck, Shirt, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const trustPartners = [
  "Supabase", "Intel", "Google Cloud (Dammam)", "Hikvision", "Dahua", "EZVIZ",
  "Axis Communications", "Alinma Bank", "SDAIA", "CITC", "NDMO",
];

export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const Arrow = ArrowLeft;

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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[200px] pointer-events-none" />

      {/* Nav */}
      <nav className="glass-strong sticky top-0 z-50 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground tracking-tight font-arabic">{t("brand")}</span>
              <span className="text-[10px] text-muted-foreground font-mono tracking-widest">{t("brand_sub")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground text-sm font-arabic">
              {t("nav.signin")}
            </Button>
            <Button onClick={() => navigate("/onboarding")} className="bg-primary text-primary-foreground text-sm h-9 font-arabic">
              {t("nav.getStarted")}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Eye className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent tracking-widest font-arabic">
              {t("hero.badge")}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight max-w-3xl mx-auto font-arabic">
            {t("hero.title1")}{" "}
            <span className="text-gradient-blue">{t("hero.title2")}</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-5 max-w-xl mx-auto font-arabic">
            {t("hero.desc")}
          </p>
          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            <Button onClick={() => navigate("/onboarding")} size="lg" className="bg-primary text-primary-foreground h-12 px-8 text-sm font-semibold glow-blue font-arabic">
              {t("hero.cta")} <Arrow className="w-4 h-4 ms-2" />
            </Button>
            <Button onClick={() => navigate("/login")} variant="outline" size="lg" className="border-border text-foreground hover:bg-secondary h-12 px-8 text-sm font-arabic">
              {t("hero.demo")}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Zero-Sight Badge */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex justify-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald/10 border-2 border-emerald/30 glow-emerald">
            <EyeOff className="w-6 h-6 text-emerald" />
            <div className="text-center">
              <p className="text-sm font-bold text-emerald font-arabic">لا تقع عليها عين بشرية</p>
              <p className="text-[10px] text-emerald/70 font-arabic">نظام مؤتمت بالكامل — صفر رؤية بشرية</p>
            </div>
            <EyeOff className="w-6 h-6 text-emerald" />
          </div>
        </motion.div>
      </section>

      {/* Trust Bar Marquee */}
      <section className="border-y border-border py-4 overflow-hidden relative">
        <div className="absolute inset-y-0 start-0 w-20 z-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, transparent, hsl(var(--background)))' }} />
        <div className="absolute inset-y-0 end-0 w-20 z-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to left, transparent, hsl(var(--background)))' }} />
        <div className="flex animate-marquee gap-12 whitespace-nowrap">
          {[...trustPartners, ...trustPartners].map((p, i) => (
            <span key={i} className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest flex-shrink-0">
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* Business Verticals */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground font-arabic">{t("verticals.title")}</h2>
          <p className="text-muted-foreground mt-3 font-arabic">{t("verticals.subtitle")}</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {verticals.map((v, i) => (
            <motion.div
              key={v.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl bg-card border border-border p-6 hover:border-primary/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-blue transition-all">
                <v.icon className={`w-5 h-5 ${v.color}`} />
              </div>
              <h3 className="text-sm font-bold text-foreground font-arabic">{t(`verticals.${v.key}.title`)}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-arabic">{t(`verticals.${v.key}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Privacy Shield */}
      <section className="border-y border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald/10 border border-emerald/20 mb-4">
              <Lock className="w-3.5 h-3.5 text-emerald" />
              <span className="text-xs font-semibold text-emerald tracking-widest font-arabic">{t("privacy_shield.badge")}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-arabic">{t("privacy_shield.title")}</h2>
            <p className="text-muted-foreground mt-3 font-arabic">{t("privacy_shield.subtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {privacyCards.map((c, i) => (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`rounded-xl bg-card border border-border p-8 text-center hover:${c.glow} transition-all`}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-5">
                  <c.icon className="w-7 h-7 text-emerald" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 font-arabic">{t(`privacy_shield.${c.key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-arabic">{t(`privacy_shield.${c.key}.desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground font-arabic">{t("brand")}</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors font-arabic">{t("nav.terms")}</button>
              <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors font-arabic">{t("nav.privacy")}</button>
              <button onClick={() => navigate("/sla")} className="hover:text-foreground transition-colors font-arabic">{t("nav.sla")}</button>
            </div>
          </div>

          {/* Contact & CR */}
          <div className="mt-6 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <a href="mailto:splittechsa@outlook.com" className="hover:text-foreground transition-colors font-mono">splittechsa@outlook.com</a>
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-arabic">
              <span className="text-muted-foreground/60">{t("footer.cr")}:</span>{" "}
              <span className="text-muted-foreground/40 font-mono">{t("footer.cr_number")}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground font-mono">
              🔒 {t("footer.tagline")}
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-2 font-arabic">
              © {new Date().getFullYear()} Split Intelligence · {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
