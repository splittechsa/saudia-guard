import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Eye, Zap, Lock, BarChart3, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Eye, title: "AI-Powered Audits", desc: "10-image time-lapse analysis with Gemini AI" },
  { icon: Lock, title: "Saudi Data Residency", desc: "All data stays within Saudi cloud nodes" },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Live compliance scores and trend insights" },
  { icon: Store, title: "Multi-Store Support", desc: "Monitor all branches from one dashboard" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[200px] pointer-events-none" />

      {/* Nav */}
      <nav className="glass-strong sticky top-0 z-50 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight">SOVEREIGN AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground text-sm">
              Sign In
            </Button>
            <Button onClick={() => navigate("/onboarding")} className="bg-primary text-primary-foreground text-sm h-9">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent uppercase tracking-widest">For Saudi Enterprises</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight max-w-3xl mx-auto">
            AI-Powered <span className="text-gradient-blue">Operational Auditing</span> for Your Business
          </h1>
          <p className="text-lg text-muted-foreground mt-5 max-w-xl mx-auto">
            Automated camera-based compliance monitoring with real-time analytics. PDPL compliant. Saudi data residency.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button onClick={() => navigate("/onboarding")} size="lg" className="bg-primary text-primary-foreground h-12 px-8 text-sm font-semibold glow-blue">
              Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button onClick={() => navigate("/login")} variant="outline" size="lg" className="border-border text-foreground hover:bg-secondary h-12 px-8 text-sm">
              View Demo
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="rounded-xl bg-card border border-border p-6 hover:border-primary/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-blue transition-all">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-xs text-muted-foreground font-mono">
          🔒 SOVEREIGN AI AUDIT SUITE · PDPL COMPLIANT · SAUDI DATA RESIDENCY
        </p>
      </footer>
    </div>
  );
}
