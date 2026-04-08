import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpLeft, Mail, MapPin, Shield, Zap } from "lucide-react";
import splitLogo from "@/assets/split-logo-icon.png";

const footerLinks = {
  product: [
    { label: "كيف يعمل", href: "#how-it-works", internal: false },
    { label: "الأسعار", href: "#pricing", internal: false },
    { label: "تجربة حية", href: "#demo-section", internal: false },
  ],
  legal: [
    { label: "سياسة الخصوصية", href: "/privacy", internal: true },
    { label: "الشروط والأحكام", href: "/terms", internal: true },
    { label: "اتفاقية مستوى الخدمة", href: "/sla", internal: true },
  ],
  support: [
    { label: "تسجيل الدخول", href: "/login", internal: true },
    { label: "إنشاء حساب", href: "/signup", internal: true },
    { label: "الدعم الفني", href: "/support", internal: true },
  ],
};

const techStack = ["Google Cloud", "Vertex AI", "Gemini", "Hikvision", "Dahua"];

export default function LandingFooter() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-border/10">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main footer grid */}
        <div className="py-16 sm:py-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <img src={splitLogo} alt="Split Tech" className="w-8 h-8" />
                <div className="absolute -inset-1 bg-primary/8 rounded-full blur-md" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[15px] font-bold text-foreground">Split Tech</span>
                <span className="text-[8px] text-muted-foreground/30 font-mono tracking-[0.2em] mt-0.5">INTELLIGENT AUDITING</span>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[280px] mb-6">
              ذكاء اصطناعي يحول كاميرات المراقبة إلى نظام رقابة تشغيلية متكامل — من سيرفرات داخل المملكة.
            </p>
            <div className="space-y-2.5">
              <a href="mailto:info@splittech.sa" className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-primary transition-colors group">
                <Mail className="w-3.5 h-3.5 group-hover:text-primary" />
                info@splittech.sa
              </a>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground/70">
                <MapPin className="w-3.5 h-3.5" />
                الدمام، المملكة العربية السعودية
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-mono text-primary/40 uppercase tracking-[0.2em] mb-5">المنتج</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-mono text-primary/40 uppercase tracking-[0.2em] mb-5">قانوني</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-mono text-primary/40 uppercase tracking-[0.2em] mb-5">الحساب</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust badges column */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-mono text-primary/40 uppercase tracking-[0.2em] mb-5">الأمان</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
                <Shield className="w-3.5 h-3.5 text-emerald/70" />
                <span>تشفير E2E</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
                <Zap className="w-3.5 h-3.5 text-primary/70" />
                <span>SLA 99.9%</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
                <MapPin className="w-3.5 h-3.5 text-gold/70" />
                <span>سيرفرات سعودية</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tech stack marquee */}
        <div className="border-t border-border/8 py-5">
          <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
            <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">Powered by</span>
            {techStack.map((t) => (
              <span key={t} className="text-[10px] font-mono text-muted-foreground/35 uppercase tracking-[0.15em] hover:text-muted-foreground/60 transition-colors cursor-default">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground/50">
            &copy; {new Date().getFullYear()} مؤسسة سبلت تيك لتقنية المعلومات. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse-live" />
              <span className="text-[10px] font-mono text-emerald/70">All Systems Operational</span>
            </div>
            <span className="w-px h-3 bg-border/20" />
            <span className="text-[10px] font-mono text-muted-foreground/40 tracking-wider">DAMMAM — KSA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
