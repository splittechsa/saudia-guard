import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sliders, Store, Brain, Clock, Bell, Cpu, Plus, Trash2, GripVertical } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MerchantControlPanel } from "@/components/dashboard/MerchantControlPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

interface StoreData {
  id: string;
  name: string;
  is_active: boolean | null;
  operating_hours: any;
  whatsapp_enabled: boolean | null;
  custom_queries: any;
  query_status: string;
  interval_minutes: number | null;
}

interface SubData {
  id: string;
  tier: string;
  status: string;
}

const expectedResponses: Record<string, string> = {
  "هل الموظفون في أماكنهم؟": "نعم، جميع الموظفين متواجدون في محطات العمل المخصصة لهم.",
  "هل المكان نظيف؟": "المنطقة بدت نظيفة بشكل عام ولم تُلاحظ مشكلات.",
  "هل يوجد زبائن بانتظار؟": "لا يوجد زبائن في وضع انتظار حالياً.",
  "كم عدد السيارات؟": "لوحظ وجود 3 سيارات في المنطقة المرئية.",
};

function getExpectedResponse(question: string): string {
  const match = Object.entries(expectedResponses).find(([key]) =>
    question.includes(key.slice(0, 15)) || key.includes(question.slice(0, 15))
  );
  if (match) return match[1];
  return "سيقوم الذكاء الاصطناعي بتحليل الصورة والإجابة على هذا السؤال بناءً على ما يراه.";
}

const maxQuestions: Record<string, number> = { basic: 5, pro: 15, enterprise: 999 };

export default function StoreControl() {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [subscription, setSubscription] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "hours" | "notifications" | "device">("questions");
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [alertThreshold, setAlertThreshold] = useState(15);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!user) return;
    const [stRes, subRes] = await Promise.all([
      supabase.from("stores").select("id, name, is_active, operating_hours, whatsapp_enabled, custom_queries, query_status, interval_minutes").eq("user_id", user.id),
      supabase.from("subscriptions").select("id, tier, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
    ]);
    if (stRes.data) {
      setStores(stRes.data as StoreData[]);
      const store = stRes.data[0];
      if (store?.custom_queries) {
        const q = Array.isArray(store.custom_queries)
          ? store.custom_queries.map((item: any) => typeof item === "string" ? item : item.question || item.q || "")
          : [];
        setQuestions(q.filter(Boolean));
      }
    }
    if (subRes.data?.[0]) setSubscription(subRes.data[0] as SubData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const store = stores[0];
  const tier = subscription?.tier || "basic";
  const maxQ = maxQuestions[tier] || 5;

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    if (questions.length >= maxQ) {
      toast({ title: "الحد الأقصى", description: `يمكنك إضافة ${maxQ} أسئلة فقط في باقتك الحالية.`, variant: "destructive" });
      return;
    }
    setQuestions([...questions, newQuestion.trim()]);
    setNewQuestion("");
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const saveQuestions = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      custom_queries: questions.map(q => ({ question: q })),
    }).eq("id", store.id);
    setSaving(false);
    if (!error) {
      toast({ title: "تم الحفظ", description: "ستُطبق الأسئلة في الجولة القادمة." });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-card/30 border border-border/20 animate-pulse" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!store) {
    return (
      <DashboardLayout>
        <div className="rounded-xl bg-card/30 border border-border/20 p-8 text-center">
          <Store className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">لا توجد متاجر مسجلة</p>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: "questions" as const, label: "أسئلة التدقيق", icon: Brain },
    { id: "hours" as const, label: "ساعات العمل", icon: Clock },
    { id: "notifications" as const, label: "الإشعارات", icon: Bell },
    { id: "device" as const, label: "الجهاز", icon: Cpu },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            لوحة التحكم — {store.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">إدارة أسئلة التدقيق وساعات العمل والإشعارات</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-card/30 border border-border/20">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-primary/[0.08] text-primary border border-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB: Questions */}
        {activeTab === "questions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">أسئلة التدقيق المخصصة</h2>
                <p className="text-xs text-muted-foreground mt-0.5">هذه الأسئلة سيجيب عليها الذكاء الاصطناعي في كل جولة</p>
              </div>
              <span className="text-xs font-mono text-primary/60 bg-primary/[0.06] px-2.5 py-1 rounded-lg">
                {questions.length} من {maxQ === 999 ? "∞" : maxQ}
              </span>
            </div>

            {/* Questions list */}
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group rounded-xl border border-border/30 bg-card/40 overflow-hidden hover:border-border/50 transition-all"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{q}</p>
                    </div>
                    <button
                      onClick={() => removeQuestion(idx)}
                      className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/[0.06] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Expected AI response preview */}
                  <div className="px-4 pb-3 pt-0">
                    <div className="rounded-lg bg-primary/[0.03] border border-primary/[0.06] px-3 py-2">
                      <p className="text-[10px] font-mono text-primary/50 mb-1">الرد المتوقع من AI</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{getExpectedResponse(q)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add question */}
            <div className="flex gap-2">
              <input
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addQuestion()}
                placeholder="اكتب سؤالاً جديداً..."
                className="flex-1 bg-card/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
              />
              <Button
                onClick={addQuestion}
                disabled={!newQuestion.trim() || questions.length >= maxQ}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Alert threshold slider */}
            <div className="rounded-xl border border-border/30 bg-card/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">عتبة التنبيه</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">نبهني إذا زاد وقت الانتظار عن هذه المدة</p>
                </div>
                <span className="text-lg font-bold font-mono text-primary">{alertThreshold} دقيقة</span>
              </div>
              <Slider
                value={[alertThreshold]}
                onValueChange={([v]) => setAlertThreshold(v)}
                min={5}
                max={60}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground/40 font-mono">
                <span>5 دقائق</span>
                <span>60 دقيقة</span>
              </div>
            </div>

            {/* Save button */}
            <div className="sticky bottom-20 md:bottom-4 z-10">
              <Button
                onClick={saveQuestions}
                disabled={saving}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm font-semibold glow-lime transition-all hover:scale-[1.01]"
              >
                {saving ? "جاري الحفظ..." : "حفظ الأسئلة"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* TAB: Working Hours */}
        {activeTab === "hours" && subscription && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MerchantControlPanel
              store={{ id: store.id, name: store.name, is_active: store.is_active, operating_hours: store.operating_hours, whatsapp_enabled: store.whatsapp_enabled }}
              subscriptionTier={tier}
              onUpdate={loadData}
            />
          </motion.div>
        )}

        {/* TAB: Notifications */}
        {activeTab === "notifications" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-xl border border-border/30 bg-card/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">تقرير واتساب اليومي</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">سيُرسل ملخص يومي كل يوم الساعة 8:00 ص</p>
                </div>
                <Switch
                  checked={store.whatsapp_enabled || false}
                  onCheckedChange={async (checked) => {
                    await supabase.from("stores").update({ whatsapp_enabled: checked }).eq("id", store.id);
                    loadData();
                  }}
                />
              </div>
              {store.whatsapp_enabled && (
                <div className="mt-4 pt-4 border-t border-border/20">
                  <label className="text-xs text-muted-foreground mb-2 block">رقم الواتساب</label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 rounded-lg bg-surface-3 text-xs text-muted-foreground font-mono border border-border/20">+966</span>
                    <input
                      placeholder="5XXXXXXXX"
                      className="flex-1 bg-card/30 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB: Device Info */}
        {activeTab === "device" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {[
              { label: "معرّف المتجر", value: store.id, mono: true },
              { label: "حالة المتجر", value: store.is_active ? "نشط" : "غير نشط" },
              { label: "فترة التدقيق", value: `${store.interval_minutes || 10} دقائق` },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border/30 bg-card/30 p-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className={`text-sm text-foreground ${item.mono ? "font-mono text-xs" : "font-medium"}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
