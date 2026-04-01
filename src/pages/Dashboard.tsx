import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Rocket, Camera, ClipboardCheck, CreditCard, Clock,
  Wifi, WifiOff, FileDown, CheckCircle2, XCircle, AlertTriangle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import HardwareSetup from "@/components/dashboard/HardwareSetup";
import { WelcomeTutorial } from "@/components/dashboard/WelcomeTutorial";
import { BroadcastBanner } from "@/components/dashboard/BroadcastBanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StoreData {
  id: string;
  name: string;
  hardware_choice: string | null;
  is_active: boolean | null;
  store_status?: string;
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
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `قبل ${hrs} ساعة`;
  return `قبل ${Math.floor(hrs / 24)} يوم`;
}

function extractQA(entry: AuditLog): { question: string; answer: string; positive: boolean }[] {
  const src = entry.observations || entry.result;
  if (!src || typeof src !== "object") return [];
  const pairs: { question: string; answer: string; positive: boolean }[] = [];
  const positiveWords = ["نعم", "yes", "نظيف", "clean", "ممتاز", "جيد", "ملتزم", "موجود", "true"];
  if (Array.isArray(src)) {
    for (const item of src) {
      const q = item.question || item.q || "";
      const a = String(item.answer || item.a || item.result || "");
      if (!q && !a) continue;
      pairs.push({ question: q, answer: a, positive: positiveWords.some(w => a.toLowerCase().includes(w)) });
    }
  } else {
    for (const [k, v] of Object.entries(src)) {
      const a = String(v);
      pairs.push({ question: k, answer: a, positive: positiveWords.some(w => a.toLowerCase().includes(w)) });
    }
  }
  return pairs;
}

function generateDailyReport(audits: AuditLog[], storeName: string): string {
  const today = new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  let report = `📋 تقرير يومي — ${storeName}\n`;
  report += `📅 ${today}\n`;
  report += `─────────────────────\n\n`;

  if (audits.length === 0) {
    report += "لا توجد جولات تدقيق اليوم.\n";
    return report;
  }

  // Collect all negative findings across audits
  const issues: Record<string, number> = {};
  for (const a of audits) {
    const qa = extractQA(a);
    for (const { question, positive } of qa) {
      if (!positive && question) issues[question] = (issues[question] || 0) + 1;
    }
  }

  const sortedIssues = Object.entries(issues).sort((a, b) => b[1] - a[1]);

  if (sortedIssues.length === 0) {
    report += "✅ لم يتم رصد أي ملاحظات سلبية اليوم. عمل ممتاز!\n";
  } else {
    report += "🔍 الملاحظات التي تحتاج انتباهك:\n\n";
    for (const [question, count] of sortedIssues) {
      const severity = count >= 3 ? "🔴" : count >= 2 ? "🟡" : "⚪";
      report += `${severity} ${question}`;
      if (count > 1) report += ` (تكررت ${count} مرات)`;
      report += "\n";
    }
    report += "\n💡 التوصية: ركّز على الملاحظات المتكررة (🔴) أولاً.\n";
  }

  report += `\n─────────────────────\n`;
  report += `عدد الجولات: ${audits.length}\n`;
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
      const storesRes = await supabase.from("stores").select("id, name, hardware_choice, is_active, store_status").eq("user_id", user.id);
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
  const storeNameMap = Object.fromEntries(stores.map(s => [s.id, s.name]));

  const latestAudit = audits.length > 0 ? audits[0] : null;
  const isConnected = latestAudit ? (Date.now() - new Date(latestAudit.created_at).getTime()) < 30 * 60 * 1000 : false;

  // Today's negative findings grouped
  const todayIssues = useMemo(() => {
    const issues: Record<string, number> = {};
    for (const a of audits) {
      const qa = extractQA(a);
      for (const { question, positive } of qa) {
        if (!positive && question) issues[question] = (issues[question] || 0) + 1;
      }
    }
    return Object.entries(issues).sort((a, b) => b[1] - a[1]);
  }, [audits]);

  const handleDownloadReport = () => {
    const storeName = stores.length === 1 ? stores[0].name : "جميع المتاجر";
    const report = generateDailyReport(audits, storeName);
    const dateStr = new Date().toISOString().split("T")[0];
    downloadReport(report, `تقرير-يومي-${dateStr}.txt`);
  };

  // ── Loading ──
  if (dashState === "loading") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 rounded bg-secondary animate-pulse" />
          <div className="h-32 rounded-xl bg-secondary animate-pulse" />
          <div className="h-48 rounded-xl bg-secondary animate-pulse" />
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3 font-arabic">أهلاً بك في ذكاء سبلت</h2>
            <p className="text-muted-foreground mb-2 font-arabic">جاري تجهيز نظام الرقابة الخاص بك.</p>
            <p className="text-sm text-muted-foreground mb-8 font-arabic">أكمل إعداد حسابك لبدء التدقيق الآلي بالذكاء الاصطناعي</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[
                { icon: CreditCard, label: "اختيار الباقة", desc: "حدد خطة تناسب احتياجاتك" },
                { icon: Camera, label: "ربط الكاميرا", desc: "أضف بيانات RTSP الخاصة بك" },
                { icon: ClipboardCheck, label: "بدء التدقيق", desc: "مراقبة آلية على مدار الساعة" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl bg-card border border-border p-4 text-center">
                  <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs font-bold text-foreground font-arabic">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-arabic">{s.desc}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => navigate("/onboarding")} className="bg-primary text-primary-foreground hover:bg-primary/90 font-arabic px-8">
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
            <h1 className="text-2xl font-bold text-foreground font-arabic">مرحباً، {displayName}</h1>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card border border-accent/30 p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
              <Clock className="w-7 h-7 text-accent animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2 font-arabic">طلبك قيد المراجعة</h2>
            <p className="text-sm text-muted-foreground mb-1 font-arabic">
              تم استلام طلب الاشتراك في باقة <span className="text-accent font-bold">{subscription?.tier === "basic" ? "الأساسي" : subscription?.tier === "pro" ? "الاحترافي" : "المؤسسي"}</span>
            </p>
            <p className="text-xs text-muted-foreground font-arabic">سيقوم فريق الإدارة بمراجعة طلبك وتفعيل حسابك في أقرب وقت.</p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/5 border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs text-accent font-mono">PENDING APPROVAL</span>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ══════════════════════════════════════════════════
  // ═══  ACTIVE DASHBOARD — Simple Merchant View  ═══
  // ══════════════════════════════════════════════════

  return (
    <DashboardLayout>
      {showWelcome && <WelcomeTutorial onClose={() => setShowWelcome(false)} />}
      <div className="space-y-5">
        <BroadcastBanner />

        {/* ── CONNECTION STATUS ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card border border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse" />
                <Wifi className="w-4 h-4 text-emerald" />
                <span className="text-sm font-semibold text-emerald font-arabic">المحل متصل — الرقابة تعمل</span>
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <WifiOff className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive font-arabic">المحل غير متصل</span>
              </>
            )}
          </div>
          {latestAudit && (
            <span className="text-xs text-muted-foreground font-arabic">آخر فحص: {timeAgo(latestAudit.created_at)}</span>
          )}
        </motion.div>

        {pendingSetupStore && (
          <HardwareSetup storeId={pendingSetupStore.id} onComplete={() => {
            setPendingSetupStore(null);
            if (user) supabase.from("stores").select("id, name, hardware_choice, is_active, store_status").eq("user_id", user.id).then(({ data }) => { if (data) setStores(data); });
          }} />
        )}

        {/* ── TODAY'S FINDINGS — Only negatives that need attention ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground font-arabic">ملاحظات اليوم</h2>
            {audits.length > 0 && (
              <Button size="sm" variant="outline" className="text-xs font-arabic gap-1.5" onClick={handleDownloadReport}>
                <FileDown className="w-3.5 h-3.5" />
                تحميل التقرير
              </Button>
            )}
          </div>

          {todayIssues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald mx-auto mb-3 opacity-60" />
              <p className="text-sm text-emerald font-arabic font-semibold">لا توجد ملاحظات سلبية اليوم</p>
              <p className="text-xs text-muted-foreground font-arabic mt-1">
                {audits.length > 0 ? "جميع الجولات أظهرت نتائج إيجابية 👏" : "لم تُجرَ جولات تدقيق بعد"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayIssues.map(([question, count], i) => (
                <div key={i} className={`rounded-lg p-3 flex items-start gap-3 ${
                  count >= 3 ? "bg-destructive/8 border border-destructive/15" :
                  count >= 2 ? "bg-accent/8 border border-accent/15" :
                  "bg-secondary/50 border border-border"
                }`}>
                  {count >= 3 ? (
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  ) : count >= 2 ? (
                    <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-arabic text-foreground">{question}</p>
                    {count > 1 && (
                      <p className="text-xs text-muted-foreground font-arabic mt-0.5">تكررت {count} مرات اليوم</p>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-primary font-arabic mt-3 pt-3 border-t border-border/50">
                💡 ركّز على حل الملاحظات المتكررة — هذا يُحسّن أداء المحل بسرعة
              </p>
            </div>
          )}
        </motion.div>

        {/* ── LATEST AUDIT SUMMARY ── */}
        {latestAudit && latestAudit.summary && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-card border border-border p-5">
            <h3 className="text-sm font-bold text-foreground font-arabic mb-2">آخر ملخص من الذكاء الاصطناعي</h3>
            <p className="text-sm text-muted-foreground font-arabic leading-relaxed">{latestAudit.summary}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-3">{timeAgo(latestAudit.created_at)}</p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
