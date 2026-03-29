import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, ArrowRight, ArrowLeft, Cpu, Monitor, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const tiers = [
  { name: "Basic", price: "299", features: ["1 Store", "4 Audits/Day", "Basic Analytics", "Email Support"], popular: false },
  { name: "Pro", price: "499", features: ["3 Stores", "12 Audits/Day", "Advanced Analytics", "Priority Support", "Custom Queries"], popular: true },
  { name: "Enterprise", price: "899", features: ["Unlimited Stores", "Unlimited Audits", "AI Insights", "Dedicated Manager", "Custom Queries", "API Access"], popular: false },
];

const defaultQuestions = [
  "Are the tables clean and sanitized?",
  "Is staff wearing proper uniform?",
  "Are products displayed correctly?",
  "Is the floor clean?",
  "Are customers being attended to?",
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [selectedTier, setSelectedTier] = useState(1);
  const [questions, setQuestions] = useState<string[]>(defaultQuestions.slice(0, 3));
  const [newQuestion, setNewQuestion] = useState("");
  const [hardwareChoice, setHardwareChoice] = useState<"software" | "hardware">("software");
  const navigate = useNavigate();

  const steps = ["Plan", "Questions", "Hardware", "Credentials"];

  return (
    <div className="min-h-screen bg-background carbon-grid relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set Up Your Audit Suite</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete these steps to activate AI-powered monitoring.</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Tier Selection */}
          {step === 0 && (
            <motion.div key="tier" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers.map((tier, i) => (
                <button
                  key={tier.name}
                  onClick={() => setSelectedTier(i)}
                  className={`relative rounded-xl p-6 text-left transition-all border ${
                    selectedTier === i
                      ? "bg-card border-primary glow-blue"
                      : "bg-card border-border hover:border-muted-foreground"
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                      Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">SAR/mo</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-emerald" /> {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 1: Question Architect */}
          {step === 1 && (
            <motion.div key="questions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-xl mx-auto">
              <div className="rounded-xl bg-card border border-border p-6">
                <h3 className="text-sm font-semibold text-foreground mb-1">Question Architect</h3>
                <p className="text-xs text-muted-foreground mb-4">Define what your AI auditor should check for.</p>
                <div className="space-y-2 mb-4">
                  {questions.map((q, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border">
                      <span className="text-xs font-mono text-primary w-5">{i + 1}.</span>
                      <span className="text-sm text-foreground flex-1">{q}</span>
                      <button onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Add a custom question..."
                    className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newQuestion.trim()) {
                        setQuestions([...questions, newQuestion.trim()]);
                        setNewQuestion("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => { if (newQuestion.trim()) { setQuestions([...questions, newQuestion.trim()]); setNewQuestion(""); }}}
                    className="bg-primary text-primary-foreground"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Hardware Choice */}
          {step === 2 && (
            <motion.div key="hardware" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "software" as const, icon: Monitor, title: "Software Only", desc: "Install on your existing PC", price: "Included" },
                { key: "hardware" as const, icon: Cpu, title: "Split-Pi Hardware", desc: "Dedicated Raspberry Pi device", price: "+600 SAR" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setHardwareChoice(opt.key)}
                  className={`rounded-xl p-6 text-left border transition-all ${
                    hardwareChoice === opt.key ? "bg-card border-primary glow-blue" : "bg-card border-border hover:border-muted-foreground"
                  }`}
                >
                  <opt.icon className={`w-8 h-8 mb-3 ${hardwareChoice === opt.key ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="text-sm font-bold text-foreground">{opt.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                  <p className="text-sm font-bold text-accent mt-3">{opt.price}</p>
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 3: Credentials */}
          {step === 3 && (
            <motion.div key="credentials" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-xl mx-auto">
              <div className="rounded-xl bg-card border border-border p-6">
                <h3 className="text-sm font-semibold text-foreground mb-1">Camera Credentials</h3>
                <p className="text-xs text-muted-foreground mb-4">Enter your RTSP/IP camera details. These are stored with enterprise-grade encryption.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">RTSP URL</label>
                    <Input placeholder="rtsp://192.168.1.100:554/stream1" className="bg-secondary border-border text-foreground font-mono text-sm placeholder:text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Username</label>
                      <Input placeholder="admin" className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Password</label>
                      <Input type="password" placeholder="••••••••" className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 max-w-xl mx-auto">
          <Button
            variant="outline"
            onClick={() => step > 0 ? setStep(step - 1) : navigate("/")}
            className="border-border text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            onClick={() => step < 3 ? setStep(step + 1) : navigate("/dashboard")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {step === 3 ? "Activate" : "Continue"} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
