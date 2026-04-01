import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store, Eye, Cpu, Clock, Rocket, Camera, ClipboardCheck, CreditCard,
  TrendingUp, AlertTriangle, Wifi, WifiOff
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import HardwareSetup from "@/components/dashboard/HardwareSetup";
import { WelcomeTutorial } from "@/components/dashboard/WelcomeTutorial";
import { BroadcastBanner } from "@/components/dashboard/BroadcastBanner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/carbon-skeleton";
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

function extractQA(entry: AuditLog): { question: string; positive: boolean }[] {
  const src = entry.observations || entry.result;
  if (!src || typeof src !== "object") return [];
  const pairs: { question: string; positive: boolean }[] = [];
  const positiveWords = ["نعم", "yes", "نظيف", "clean", "ممتاز", "جيد", "ملتزم", "موجود", "true"];
  if (Array.isArray(src)) {
    for (const item of src) {
      const q = item.question || item.q || "";
      const a = String(item.answer || item.a || item.result || "");
      if (!q && !a) continue;
      pairs.push({ question: q, positive: positiveWords.some(w => a.toLowerCase().includes(w)) });
    }
  } else {
    for (const [k, v] of Object.entries(src)) {
      pairs.push({ question: k, positive: positiveWords.some(w => String(v).toLowerCase().includes(w)) });
    }
  }
  return pairs;
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

      const [subsRes, auditsRes] = await Promise.all([
        supabase.from("subscriptions").select("id, tier, status, price_sar").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        storeIds.length > 0
          ? supabase.from("analytics_logs").select("id, store_id, score, status, summary, result, observations, created_at").in("store_id", storeIds).order("created_at", { ascending: false }).limit(30)
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
          setAudits(prev => [payload.new as AuditLog, ...prev].slice(0, 30));
        })
        .subscribe()
    );
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [user, dashState, stores]);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "التاجر";

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const todayAudits = useMemo(() => audits.filter(a => new Date(a.created_at) >= todayStart && a.score !== null), [audits, todayStart]);

  const avgScore = useMemo(() => {
    if (todayAudits.length === 0) return 0;
    return Math.round(todayAudits.reduce((s, a) => s + (a.score || 0), 0) / todayAudits.length);
  }, [todayAudits]);

  const topFailure = useMemo(() => {
    const failCounts: Record<string, number> = {};
    let totalAudits = 0;
    for (const a of todayAudits) {
      const qa = extractQA(a);
      if (qa.length > 0) totalAudits++;
      for (const { question, positive } of qa) {
        if (!positive && question) failCounts[question] = (failCounts[question] || 0) + 1;
      }
    }
    const sorted = Object.entries(failCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    return { question: sorted[0][0], count: sorted[0][1], total: totalAudits };
  }, [todayAudits]);

  const chartData = useMemo(() => {
    return todayAudits.slice().reverse().map(a => ({
      time: new Date(a.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      score: a.score || 0,
    }));
  }, [todayAudits]);

  const latestAudit = audits.length > 0 ? audits[0] : null;
  const isConnected = latestAudit ? (Date.now() - new Date(latestAudit.created_at).getTime()) < 30 * 60 * 1000 : false;

  // ── Loading ──
  if (dashState === "loading") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 rounded bg-secondary animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
          </div>
          <TableSkeleton rows={3} />
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
  // ═══  ACTIVE DASHBOARD — Overview Only          ═══
  // ══════════════════════════════════════════════════

  return (
    <DashboardLayout>
      {showWelcome && <WelcomeTutorial onClose={() => setShowWelcome(false)} />}
      <div className="space-y-5">
        <BroadcastBanner />

        {/* ── 1. LIVE PULSE BAR ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card border border-border p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse" />
                <Wifi className="w-4 h-4 text-emerald" />
                <span className="text-xs sm:text-sm font-semibold text-emerald font-arabic">المحل متصل</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <WifiOff className="w-4 h-4 text-destructive" />
                <span className="text-xs sm:text-sm font-semibold text-destructive font-arabic">المحل غير متصل</span>
              </div>
            )}
          </div>
          {latestAudit && (
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <span className="text-muted-foreground font-arabic text-[10px] sm:text-xs">آخر جولة: {timeAgo(latestAudit.created_at)}</span>
              {latestAudit.score !== null && (
                <Badge variant="outline" className={`text-[10px] font-mono ${
                  latestAudit.score >= 80 ? "text-emerald border-emerald/30" :
                  latestAudit.score >= 50 ? "text-accent border-accent/30" :
                  "text-destructive border-destructive/30"
                }`}>
                  {latestAudit.score}%
                </Badge>
              )}
            </div>
          )}
        </motion.div>

        {/* ── 2. DAILY SNAPSHOT ── */}
        <div>
          <h2 className="text-lg font-bold text-foreground font-arabic mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            ملخص الـ 24 ساعة الماضية
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard icon={Eye} label="جولات اليوم" value={String(todayAudits.length)} numericValue={todayAudits.length}
              change={todayAudits.length > 0 ? "جولة مع نتائج" : "بانتظار البيانات"} changeType={todayAudits.length > 0 ? "positive" : "neutral"} glowColor="blue" />
            <StatCard icon={TrendingUp} label="نسبة الانضباط" value={avgScore > 0 ? `${avgScore}%` : "--"} numericValue={avgScore > 0 ? avgScore : undefined}
              change={avgScore >= 80 ? "أداء ممتاز" : avgScore > 0 ? "يحتاج تحسين" : "لا توجد بيانات"} changeType={avgScore >= 80 ? "positive" : avgScore > 0 ? "negative" : "neutral"} glowColor={avgScore >= 80 ? "emerald" : "gold"} />
            <StatCard icon={Cpu} label="الأجهزة" value={stores.filter(s => s.hardware_choice).length + "/" + stores.length}
              change={pendingSetupStore ? "يحتاج إعداد" : "مكتمل"} changeType={pendingSetupStore ? "negative" : "positive"} glowColor="blue" />
          </div>
        </div>

        {pendingSetupStore && (
          <HardwareSetup storeId={pendingSetupStore.id} onComplete={() => {
            setPendingSetupStore(null);
            if (user) supabase.from("stores").select("id, name, hardware_choice, is_active, store_status").eq("user_id", user.id).then(({ data }) => { if (data) setStores(data); });
          }} />
        )}

        {/* ── 3. ACTIONABLE INSIGHT ── */}
        {topFailure && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground font-arabic">أبرز مخالفة متكررة اليوم</p>
              <p className="text-sm text-muted-foreground font-arabic mt-1">
                "{topFailure.question}" — تم رصدها في <span className="text-destructive font-bold">{topFailure.count}</span> من أصل <span className="font-bold">{topFailure.total}</span> جولة
              </p>
              <p className="text-xs text-primary font-arabic mt-2">
                💡 {topFailure.count / topFailure.total >= 0.5 ? "مشكلة متكررة — أضفها لقائمة المراجعة اليومية" : "ملاحظة عرضية — تابعها خلال الأيام القادمة"}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── 4. 24H TREND CHART ── */}
        {chartData.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground font-arabic">خط الأداء — آخر 24 ساعة</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-arabic">نسبة الانضباط عبر الجولات</p>
              </div>
              <span className="text-[10px] text-emerald font-mono uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald" /> LIVE
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", fontSize: "12px" }} />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#scoreGrad)" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── 5. QUICK LINKS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-4 flex items-center gap-3 justify-start font-arabic" onClick={() => navigate("/dashboard/audit")}>
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <div className="text-right">
              <p className="text-sm font-semibold">تقارير التدقيق</p>
              <p className="text-[10px] text-muted-foreground">عرض جميع الجولات مع التوصيات</p>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex items-center gap-3 justify-start font-arabic" onClick={() => navigate("/dashboard/store-control")}>
            <Store className="w-5 h-5 text-primary" />
            <div className="text-right">
              <p className="text-sm font-semibold">تحكم المتجر</p>
              <p className="text-[10px] text-muted-foreground">ساعات العمل والأسئلة المخصصة</p>
            </div>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
