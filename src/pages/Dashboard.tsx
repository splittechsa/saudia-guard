import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Camera, ClipboardCheck, CreditCard, Clock,
  Wifi, WifiOff, FileDown, ChevronDown, Settings, CalendarClock,
  AlertTriangle, TrendingUp, Sparkles
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import HardwareSetup from "@/components/dashboard/HardwareSetup";
import { WelcomeTutorial } from "@/components/dashboard/WelcomeTutorial";
import { BroadcastBanner } from "@/components/dashboard/BroadcastBanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface StoreData {
  id: string;
  name: string;
  hardware_choice: string | null;
  is_active: boolean | null;
  store_status?: string;
  interval_minutes?: number | null;
}

interface SubData {
  id: string;
  tier: string;
  status: string;
  price_sar: number;
}

interface AuditLog {
  id: string;
  store_id: string;
  score: number | null;
  status: string | null;
  summary: string | null;
  result: any;
  observations: any;
  created_at: string;
}

type DashState = "loading" | "no_subscription" | "pending_approval" | "active";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  return `منذ ${Math.floor(hrs / 24)} يوم`;
}

function extractQA(entry: AuditLog): { question: string; answer: string }[] {
  const src = entry.observations || entry.result;
  if (!src || typeof src !== "object") return [];
  const pairs: { question: string; answer: string }[] = [];
  if (Array.isArray(src)) {
    for (const item of src) {
      const q = item.question || item.q || "";
      const a = String(item.answer || item.a || item.result || "");
      if (!q && !a) continue;
      pairs.push({ question: q, answer: a });
    }
  } else {
    for (const [k, v] of Object.entries(src)) {
      pairs.push({ question: k, answer: String(v) });
    }
  }
  return pairs;
}

function generateDailyReport(audits: AuditLog[], storeName: string): string {
  const today = new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  let report = `تقرير — ${storeName}\n`;
  report += `${today}\n`;
  report += `─────────────────────\n\n`;
  if (audits.length === 0) {
    report += "لا توجد جولات تدقيق.\n";
    return report;
  }
  for (const audit of audits) {
    const time = new Date(audit.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    report += `${time}\n`;
    if (audit.summary) report += `${audit.summary}\n`;
    const qa = extractQA(audit);
    for (const { question, answer } of qa) {
      report += `  ${question}: ${answer}\n`;
    }
    report += `\n`;
  }
  return report;
}

function downloadReport(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Generate AI Executive Summary ── */
function generateExecutiveSummary(audits: AuditLog[], storeName: string, displayName: string): string {
  if (audits.length === 0) return "";
  const totalCycles = audits.length;
  const summaries = audits.map(a => a.summary).filter(Boolean);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء الخير";
  
  let summary = `${greeting} يا ${displayName}. `;
  summary += `تم إجراء ${totalCycles} جولة تدقيق اليوم على ${storeName}. `;
  
  if (summaries.length > 0) {
    summary += summaries[0] || "";
  } else {
    summary += "النظام يعمل بشكل طبيعي ولا توجد ملاحظات جوهرية.";
  }
  
  return summary;
}

/* ── Audit Card Component ── */
function AuditCard({ audit, isFirst }: { audit: AuditLog; isFirst?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const qa = extractQA(audit);
  const time = new Date(audit.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden transition-all duration-300 ${
        isFirst 
          ? "bg-card/80 border-primary/20 glow-lime" 
          : "bg-card/50 border-border/30 hover:border-border/50"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary/[0.02] transition-colors"
      >
        <div className="text-right flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-primary/60 bg-primary/[0.06] px-2 py-0.5 rounded">{time}</span>
            {isFirst && (
              <span className="text-[10px] text-primary font-medium">الأحدث</span>
            )}
          </div>
          {audit.summary && (
            <p className="text-sm text-foreground leading-relaxed truncate">{audit.summary}</p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && qa.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="border-t border-border/20 divide-y divide-border/10">
              {qa.map((item, i) => (
                <div key={i} className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-foreground mb-1">{item.question}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Countdown Timer ── */
function CountdownTimer({ intervalMinutes }: { intervalMinutes: number }) {
  const [remaining, setRemaining] = useState(intervalMinutes * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => (prev <= 0 ? intervalMinutes * 60 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [intervalMinutes]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-border/30 bg-card/30 p-5 text-center"
    >
      <p className="text-xs text-muted-foreground mb-2">الجولة القادمة خلال</p>
      <div className="flex items-center justify-center gap-1">
        <span className="text-3xl font-bold font-mono text-primary tabular-nums">
          {String(mins).padStart(2, "0")}
        </span>
        <span className="text-xl text-primary/50 font-bold animate-pulse">:</span>
        <span className="text-3xl font-bold font-mono text-primary tabular-nums">
          {String(secs).padStart(2, "0")}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">ضمن ساعات العمل المحددة</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, profile, hasRole } = useAuth();
  const navigate = useNavigate();
  const [dashState, setDashState] = useState<DashState>("loading");
  const [stores, setStores] = useState<StoreData[]>([]);
  const [subscription, setSubscription] = useState<SubData | null>(null);
  const [pendingSetupStore, setPendingSetupStore] = useState<StoreData | null>(null);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (hasRole("super_owner")) { navigate("/admin", { replace: true }); return; }
    if (hasRole("it_support")) { navigate("/it-dashboard", { replace: true }); return; }
  }, [hasRole, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const storesRes = await supabase.from("stores").select("id, name, hardware_choice, is_active, store_status, interval_minutes").eq("user_id", user.id);
      const storesData = storesRes.data || [];
      const storeIds = storesData.map(s => s.id);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      const [subsRes, auditsRes] = await Promise.all([
        supabase.from("subscriptions").select("id, tier, status, price_sar").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        storeIds.length > 0
          ? supabase.from("analytics_logs").select("id, store_id, score, status, summary, result, observations, created_at").in("store_id", storeIds).gte("created_at", todayStart.toISOString()).order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

      const subData = subsRes.data?.[0] || null;
      setStores(storesData);
      setSubscription(subData);

      if (!subData && storesData.length === 0) { setDashState("no_subscription"); return; }
      if (subData?.status === "pending") { setDashState("pending_approval"); return; }
      setDashState("active");

      const tutorialKey = `split_welcome_${user.id}`;
      if (!localStorage.getItem(tutorialKey)) { setShowWelcome(true); localStorage.setItem(tutorialKey, "1"); }
      const needsSetup = storesData.find((s) => !s.hardware_choice);
      if (needsSetup) setPendingSetupStore(needsSetup);
      setAudits((auditsRes as any).data || []);
    };
    fetchData();
  }, [user]);

  // Realtime
  useEffect(() => {
    if (!user || dashState !== "active" || stores.length === 0) return;
    const channels = stores.map(s =>
      supabase.channel(`dash-live-${s.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_logs", filter: `store_id=eq.${s.id}` }, (payload) => {
          setAudits(prev => [payload.new as AuditLog, ...prev]);
        })
        .subscribe()
    );
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [user, dashState, stores]);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "التاجر";
  const latestAudit = audits.length > 0 ? audits[0] : null;
  const isConnected = latestAudit ? (Date.now() - new Date(latestAudit.created_at).getTime()) < 30 * 60 * 1000 : false;
  const intervalMinutes = stores[0]?.interval_minutes || 10;

  const handleDownloadReport = () => {
    const storeName = stores.length === 1 ? stores[0].name : "جميع المتاجر";
    const report = generateDailyReport(audits, storeName);
    const dateStr = new Date().toISOString().split("T")[0];
    downloadReport(report, `تقرير-${dateStr}.txt`);
  };

  // ── Loading ──
  if (dashState === "loading") {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl bg-card/30 border border-border/20 animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // ── No Subscription ──
  if (dashState === "no_subscription") {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/[0.08] border border-primary/15 mb-6">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">أهلاً بك في Split Tech</h2>
            <p className="text-muted-foreground mb-2">جاري تجهيز نظام الرقابة الخاص بك.</p>
            <p className="text-sm text-muted-foreground mb-8">أكمل إعداد حسابك لبدء التدقيق الآلي بالذكاء الاصطناعي</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[
                { icon: CreditCard, label: "اختيار الباقة", desc: "حدد خطة تناسب احتياجاتك" },
                { icon: Camera, label: "ربط الكاميرا", desc: "أضف بيانات RTSP الخاصة بك" },
                { icon: ClipboardCheck, label: "بدء التدقيق", desc: "مراقبة آلية على مدار الساعة" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="rounded-xl bg-card/40 border border-border/30 p-4 text-center hover-glow"
                >
                  <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs font-bold text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
                </motion.div>
              ))}
            </div>
            <Button onClick={() => navigate("/onboarding")} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 glow-lime transition-all hover:scale-[1.02]">
              <Rocket className="w-4 h-4 me-2" /> ابدأ الإعداد
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Pending Approval ──
  if (dashState === "pending_approval") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-bold text-foreground">مرحباً، {displayName}</h1>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card/50 border border-primary/15 p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/[0.08] border border-primary/15 mb-4">
              <Clock className="w-7 h-7 text-primary animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">طلبك قيد المراجعة</h2>
            <p className="text-sm text-muted-foreground mb-1">
              تم استلام طلب الاشتراك في باقة <span className="text-primary font-bold">{subscription?.tier === "basic" ? "الأساسي" : subscription?.tier === "pro" ? "الاحترافي" : "المؤسسي"}</span>
            </p>
            <p className="text-xs text-muted-foreground">سيقوم فريق الإدارة بمراجعة طلبك وتفعيل حسابك في أقرب وقت.</p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/[0.05] border border-primary/15">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
              <span className="text-xs text-primary font-mono">PENDING APPROVAL</span>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ══════════════════════════════════════════════════
  // ═══  ACTIVE DASHBOARD — COMMAND CENTER         ═══
  // ══════════════════════════════════════════════════

  const storeName = stores.length === 1 ? stores[0].name : "متاجرك";
  const executiveSummary = generateExecutiveSummary(audits, storeName, displayName);

  return (
    <DashboardLayout>
      {showWelcome && <WelcomeTutorial onClose={() => setShowWelcome(false)} />}
      <div className="space-y-5">
        <BroadcastBanner />

        {/* ── GREETING + STATUS ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">مرحباً، {displayName}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{storeName}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {isConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald/[0.08] border border-emerald/15">
                <span className="w-2 h-2 rounded-full bg-emerald animate-pulse-dot" />
                <Wifi className="w-3.5 h-3.5 text-emerald" />
                <span className="text-xs text-emerald font-medium">متصل</span>
                {latestAudit && <span className="text-[10px] text-emerald/60">— آخر جولة {timeAgo(latestAudit.created_at)}</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/[0.08] border border-destructive/15">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                <WifiOff className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs text-destructive font-medium">غير متصل — تحقق من الجهاز</span>
              </div>
            )}
          </motion.div>
        </div>

        {pendingSetupStore && (
          <HardwareSetup storeId={pendingSetupStore.id} onComplete={() => {
            setPendingSetupStore(null);
            if (user) supabase.from("stores").select("id, name, hardware_choice, is_active, store_status, interval_minutes").eq("user_id", user.id).then(({ data }) => { if (data) setStores(data); });
          }} />
        )}

        {/* ── EXECUTIVE SUMMARY (AI Insight) ── */}
        {executiveSummary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/[0.04] to-transparent p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/[0.1] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-primary/60 mb-1.5 uppercase tracking-wider">ملخص تنفيذي</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{executiveSummary}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── COUNTDOWN + STATS ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CountdownTimer intervalMinutes={intervalMinutes} />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border/30 bg-card/30 p-5 text-center"
          >
            <p className="text-xs text-muted-foreground mb-2">جولات اليوم</p>
            <p className="text-3xl font-bold text-foreground font-mono">{audits.length}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">جولة تدقيق</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border/30 bg-card/30 p-5 text-center"
          >
            <p className="text-xs text-muted-foreground mb-2">حالة النظام</p>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald" />
              <p className="text-sm font-bold text-emerald">يعمل بكفاءة</p>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">OPERATIONAL</p>
          </motion.div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: FileDown, label: "تحميل تقرير اليوم", action: handleDownloadReport, disabled: audits.length === 0 },
            { icon: Settings, label: "تعديل الأسئلة", action: () => navigate("/dashboard/store-control") },
            { icon: CalendarClock, label: "ساعات العمل", action: () => navigate("/dashboard/store-control") },
          ].map((btn, i) => (
            <Button
              key={i}
              variant="outline"
              onClick={btn.action}
              disabled={btn.disabled}
              className="h-auto py-3.5 flex flex-col items-center gap-2 text-xs border-border/30 hover:border-primary/20 hover:bg-primary/[0.03] transition-all duration-300 group"
            >
              <btn.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">{btn.label}</span>
            </Button>
          ))}
        </div>

        {/* ── TODAY'S AUDIT FEED ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">جولات اليوم</h2>
            {audits.length > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground/50">{audits.length} جولة</span>
            )}
          </div>

          {audits.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl bg-card/30 border border-border/20 p-10 text-center">
              <div className="animate-float">
                <ClipboardCheck className="w-10 h-10 text-muted-foreground/15 mx-auto mb-3" />
              </div>
              <p className="text-sm text-muted-foreground">لم تبدأ الجولات بعد. النظام جاهز.</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {audits.slice(0, 5).map((audit, idx) => (
                <AuditCard key={audit.id} audit={audit} isFirst={idx === 0} />
              ))}
              {audits.length > 5 && (
                <button
                  onClick={() => navigate("/dashboard/audit")}
                  className="w-full text-center text-xs text-primary hover:text-primary/80 py-3 rounded-lg border border-border/20 hover:border-primary/20 transition-all"
                >
                  عرض جميع الجولات ({audits.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
