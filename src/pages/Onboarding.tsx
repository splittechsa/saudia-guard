import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, ArrowRight, ArrowLeft, Plus, X, Rocket, Camera, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const tiers = [
  { name: "Basic", nameAr: "أساسي", price: 299, features: ["متجر واحد", "4 تدقيقات/يوم", "تحليلات أساسية", "دعم بالإيميل"], popular: false },
  { name: "Pro", nameAr: "احترافي", price: 499, features: ["3 متاجر", "12 تدقيق/يوم", "تحليلات متقدمة", "دعم أولوية", "استعلامات مخصصة"], popular: true },
  { name: "Enterprise", nameAr: "مؤسسي", price: 899, features: ["متاجر غير محدودة", "تدقيقات غير محدودة", "رؤى ذكاء اصطناعي", "مدير حساب مخصص", "استعلامات مخصصة", "وصول API"], popular: false },
];

const tierKeys = ["basic", "pro", "enterprise"] as const;

const defaultQuestions = [
  "هل الطاولات نظيفة ومعقمة؟",
  "هل الموظفون يرتدون الزي الرسمي؟",
  "هل المنتجات معروضة بشكل صحيح؟",
  "هل الأرضية نظيفة؟",
  "هل يتم خدمة العملاء؟",
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [selectedTier, setSelectedTier] = useState(1);
  const [questions, setQuestions] = useState<string[]>(defaultQuestions.slice(0, 3));
  const [newQuestion, setNewQuestion] = useState("");
  const [storeName, setStoreName] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const steps = [
    { label: "الباقة", icon: Shield },
    { label: "الأسئلة", icon: ClipboardCheck },
    { label: "المتجر", icon: Camera },
  ];

  const handleActivate = async () => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }
    if (!storeName.trim()) {
      toast.error("يرجى إدخال اسم المتجر");
      return;
    }

    setSaving(true);

    // Create subscription with pending status (needs admin approval)
    const { data: createdSub, error: subError } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      tier: tierKeys[selectedTier],
      price_sar: tiers[selectedTier].price,
      status: "pending",
    }).select("id").single();

    if (subError) {
      toast.error("فشل في إنشاء الاشتراك: " + subError.message);
      setSaving(false);
      return;
    }

    // Create store with pending query status
    const { error: storeError } = await supabase.from("stores").insert({
      user_id: user.id,
      name: storeName.trim(),
      custom_queries: questions,
      query_status: "pending",
      store_status: "draft",
      is_active: false,
    });

    if (storeError) {
      if (createdSub?.id) {
        await supabase.from("subscriptions").delete().eq("id", createdSub.id);
      }
      toast.error("فشل في إنشاء المتجر: " + storeError.message);
      setSaving(false);
      return;
    }

    toast.success("تم إرسال طلب الاشتراك! جاري التوجيه للدفع...");
    setSaving(false);
    navigate(`/dashboard/payment?tier=${tierKeys[selectedTier]}`);
  };

  return (
    <div className="min-h-screen bg-background carbon-grid relative overflow-hidden" dir="rtl">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-arabic">إعداد نظام الرقابة الذكية</h1>
          <p className="text-sm text-muted-foreground mt-1 font-arabic">أكمل الخطوات التالية لتفعيل المراقبة بالذكاء الاصطناعي</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-xs font-medium hidden sm:block font-arabic ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Tier Selection */}
          {step === 0 && (
            <motion.div key="tier" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers.map((tier, i) => (
                <button
                  key={tier.name}
                  onClick={() => setSelectedTier(i)}
                  className={`relative rounded-xl p-6 text-right transition-all border ${
                    selectedTier === i ? "bg-card border-primary glow-blue" : "bg-card border-border hover:border-muted-foreground"
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20 font-arabic">الأكثر طلباً</span>
                  )}
                  <h3 className="text-lg font-bold text-foreground font-arabic">{tier.nameAr}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{tier.name}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                    <span className="text-sm text-muted-foreground font-arabic">ر.س/شهرياً</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground font-arabic">
                        <Check className="w-3.5 h-3.5 text-emerald shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 1: Questions */}
          {step === 1 && (
            <motion.div key="questions" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-xl mx-auto">
              <div className="rounded-xl bg-card border border-border p-6">
                <h3 className="text-sm font-semibold text-foreground mb-1 font-arabic">مهندس الأسئلة</h3>
                <p className="text-xs text-muted-foreground mb-4 font-arabic">حدد ما يجب على المدقق الذكي فحصه في متجرك</p>
                <div className="space-y-2 mb-4">
                  {questions.map((q, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border">
                      <span className="text-xs font-mono text-primary w-5">{i + 1}.</span>
                      <span className="text-sm text-foreground flex-1 font-arabic">{q}</span>
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
                    placeholder="أضف سؤال تدقيق مخصص..."
                    className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground font-arabic"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newQuestion.trim()) {
                        setQuestions([...questions, newQuestion.trim()]);
                        setNewQuestion("");
                      }
                    }}
                  />
                  <Button size="sm" onClick={() => { if (newQuestion.trim()) { setQuestions([...questions, newQuestion.trim()]); setNewQuestion(""); }}} className="bg-primary text-primary-foreground">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Store Name */}
          {step === 2 && (
            <motion.div key="store" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-xl mx-auto">
              <div className="rounded-xl bg-card border border-border p-6">
                <h3 className="text-sm font-semibold text-foreground mb-1 font-arabic">بيانات المتجر</h3>
                <p className="text-xs text-muted-foreground mb-4 font-arabic">أدخل اسم متجرك. ستقوم بإعداد الكاميرا والأجهزة لاحقاً في لوحة التحكم.</p>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-arabic">اسم المتجر</label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="سبلت كتس - الرياض" className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground font-arabic" />
                </div>
                <div className="mt-6 rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground font-arabic">ماذا بعد؟</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground font-arabic">
                    <p>🛠️ ربط الكاميرا بنظام RTSP</p>
                    <p>✅ اعتماد الأسئلة من الإدارة</p>
                    <p>🚀 بدء التدقيق الآلي بالذكاء الاصطناعي</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 max-w-xl mx-auto">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate("/")} className="border-border text-foreground hover:bg-secondary font-arabic">
            <ArrowLeft className="w-4 h-4 ms-2" /> رجوع
          </Button>
          <Button
            onClick={() => step < 2 ? setStep(step + 1) : handleActivate()}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-arabic"
          >
            {step === 2 ? (saving ? "جاري التفعيل..." : "تفعيل الاشتراك") : "التالي"} <ArrowRight className="w-4 h-4 me-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
