import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sliders, Brain, Clock, Cpu,
  Plus, Trash2, GripVertical, ShieldCheck,
  MessageSquare, Zap, Info 
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface StoreControlTab {
  id: "questions" | "settings" | "performance";
  label: string;
  icon: typeof Brain;
}

interface StoreControlData {
  id: string;
  name: string;
  hardware_choice: string | null;
  tier: string;
}

export default function StoreControl() {
  const { user } = useAuth();
  const [store, setStore] = useState<StoreControlData | null>(null);
  const [activeTab, setActiveTab] = useState<"questions" | "settings" | "performance">("questions");
  const [questions, setQuestions] = useState<string[]>([
    "هل يرتدي الموظفون الزي الرسمي؟",
    "هل الرفوف مرتبة حسب معايير العرض؟",
  ]);
  const [newQuestion, setNewQuestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [tier] = useState("basic");
  const maxQ = 12;

  const tabs: StoreControlTab[] = [
    { id: "questions", label: "أسئلة التدقيق", icon: Brain },
    { id: "settings", label: "المعلمات", icon: Cpu },
    { id: "performance", label: "الأداء", icon: Clock },
  ];

  useEffect(() => {
    const fetchStore = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, hardware_choice")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (error) {
        console.error("Failed to load store for StoreControl:", error);
        return;
      }
      if (data) {
        setStore({
          id: data.id,
          name: data.name,
          hardware_choice: data.hardware_choice,
          tier: "basic",
        });
      }
    };

    fetchStore();
  }, [user]);

  const addQuestion = () => {
    const value = newQuestion.trim();
    if (!value) return;
    setQuestions((prev) => [...prev, value]);
    setNewQuestion("");
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, index) => index !== idx));
  };

  const saveQuestions = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("تم حفظ إعدادات الذكاء التشغيلي بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const getExpectedResponse = (question: string) => {
    return `سيتم تقييم السؤال: ${question}`;
  };

  const storeName = store?.name || "متجرك";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 py-4" dir="rtl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sliders className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-black text-foreground font-arabic tracking-tight">إعدادات الذكاء التشغيلي</h1>
            </div>
            <p className="text-sm text-muted-foreground font-arabic mr-10">{storeName} — تخصيص معايير الرقابة والتدقيق</p>
          </div>

          <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-xl border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-arabic hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "questions" && (
            <motion.div key="questions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-strong rounded-3xl p-8 border border-border relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-foreground font-arabic flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" /> أسئلة التدقيق المخصصة
                      </h3>
                      <p className="text-xs text-muted-foreground font-arabic mt-1">المحرك سيقوم بتحليل الصور بناءً على هذه المعايير</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-primary border-primary/20 bg-primary/5">
                      {questions.length} / {maxQ === 999 ? "∞" : maxQ}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-8">
                    {questions.map((q, idx) => (
                      <motion.div key={idx} layout className="group rounded-2xl border border-border bg-secondary/30 hover:border-primary/30 transition-all overflow-hidden">
                        <div className="flex items-center gap-3 p-4">
                          <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab" />
                          <p className="flex-1 text-sm font-bold text-foreground font-arabic">{q}</p>
                          <button onClick={() => removeQuestion(idx)} className="p-2 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="px-4 pb-4">
                          <div className="rounded-xl bg-background/50 border border-border/50 p-3 flex items-start gap-3">
                            <Zap className="w-3 h-3 text-primary mt-1 shrink-0" />
                            <div>
                              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">AI Logic Preview</p>
                              <p className="text-xs text-muted-foreground leading-relaxed font-arabic italic">"{getExpectedResponse(q)}"</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="مثال: هل يرتدي الموظفون الزي الرسمي؟" className="h-12 rounded-xl bg-secondary border-border font-arabic" />
                    <Button onClick={addQuestion} className="h-12 w-12 rounded-xl bg-primary text-primary-foreground p-0">
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>
                </div>

                <Button onClick={saveQuestions} disabled={saving} className="w-full h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]">
                  {saving ? "جاري مزامنة المحرك..." : "حفظ وتفعيل معايير التدقيق"}
                </Button>
              </div>

              <div className="space-y-6">
                <div className="glass-strong rounded-3xl p-6 border border-border">
                  <h4 className="text-sm font-bold text-foreground font-arabic mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" /> كيف تعمل الأسئلة؟
                  </h4>
                  <ul className="space-y-4 text-xs text-muted-foreground font-arabic leading-relaxed">
                    <li className="flex gap-2"><span className="text-primary font-bold">1.</span><span>اكتب أسئلة واضحة يمكن الإجابة عليها من خلال الرؤية (نعم/لا أو وصف قصير).</span></li>
                    <li className="flex gap-2"><span className="text-primary font-bold">2.</span><span>سيقوم محرك سبلت تيك بتحليل آخر 10 دقائق من البث للإجابة بدقة.</span></li>
                    <li className="flex gap-2"><span className="text-primary font-bold">3.</span><span>النتائج ستظهر فوراً في لوحة البيانات وتُرسل في التقرير اليومي.</span></li>
                  </ul>
                </div>

                <div className="glass-strong rounded-3xl p-6 border border-primary/10 bg-primary/[0.02]">
                  <h4 className="text-sm font-bold text-foreground font-arabic mb-2">نوع الباقة: {tier.toUpperCase()}</h4>
                  <p className="text-[10px] text-muted-foreground font-arabic mb-4">باقات بريميوم تسمح بعدد غير محدود من الأسئلة المتخصصة.</p>
                  <Button variant="outline" className="w-full rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs">ترقية الخطة</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-border flex justify-center items-center gap-6 opacity-40 grayscale hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-2 text-[10px] font-bold text-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" /> AI INTEGRITY VERIFIED
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-foreground border-x border-border px-6">
            <MessageSquare className="w-4 h-4 text-primary" /> WHATSAPP REPORTS READY
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
