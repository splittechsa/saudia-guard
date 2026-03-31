import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, BarChart3, Shield, TrendingUp, Eye, Cpu, Clock, Users, Rocket, Camera, ClipboardCheck, CreditCard } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { AuditLogItem } from "@/components/ui/audit-log-item";
import HardwareSetup from "@/components/dashboard/HardwareSetup";
import { ComparativeChart } from "@/components/dashboard/ComparativeChart";
import { WelcomeTutorial } from "@/components/dashboard/WelcomeTutorial";
import { MerchantControlPanel } from "@/components/dashboard/MerchantControlPanel";
import { LiveAuditFeed } from "@/components/dashboard/LiveAuditFeed";
import { BroadcastBanner } from "@/components/dashboard/BroadcastBanner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/carbon-skeleton";
import { Button } from "@/components/ui/button";

interface StoreData {
  id: string;
  name: string;
  hardware_choice: string | null;
  is_active: boolean | null;
}

interface SubData {
  id: string;
  tier: string;
  status: string;
  price_sar: number;
}

interface StoreWithHours extends StoreData {
  operating_hours: any;
  store_status: string;
}

interface AuditLog {
  id: string;
  store_id: string;
  score: number | null;
  status: string | null;
  summary: string | null;
  result: any;
  created_at: string;
}

type DashState = "loading" | "no_subscription" | "pending_approval" | "active";

export default function Dashboard() {
  const { user, profile, hasRole } = useAuth();
  const navigate = useNavigate();
  const [dashState, setDashState] = useState<DashState>("loading");
  const [stores, setStores] = useState<StoreData[]>([]);
  const [subscription, setSubscription] = useState<SubData | null>(null);
  const [pendingSetupStore, setPendingSetupStore] = useState<StoreData | null>(null);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [chartData, setChartData] = useState<{ time: string; score: number }[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  // Role-based redirect: IT/Admin should never see merchant dashboard
  useEffect(() => {
    if (hasRole("super_owner")) { navigate("/admin", { replace: true }); return; }
    if (hasRole("it_support")) { navigate("/it-dashboard", { replace: true }); return; }
  }, [hasRole, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [storesRes, subsRes, auditsRes] = await Promise.all([
        supabase.from("stores").select("id, name, hardware_choice, is_active, operating_hours, store_status").eq("user_id", user.id),
        supabase.from("subscriptions").select("id, tier, status, price_sar").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("analytics_logs").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

      const storesData = storesRes.data || [];
      const subData = subsRes.data?.[0] || null;

      setStores(storesData);
      setSubscription(subData);

      if (!subData && storesData.length === 0) {
        setDashState("no_subscription");
        return;
      }

      if (subData?.status === "pending") {
        setDashState("pending_approval");
        return;
      }

      setDashState("active");

      // Show welcome tutorial on first activation
      const tutorialKey = `split_welcome_${user.id}`;
      if (!localStorage.getItem(tutorialKey)) {
        setShowWelcome(true);
        localStorage.setItem(tutorialKey, "1");
      }
      const needsSetup = storesData.find((s) => !s.hardware_choice);
      if (needsSetup) setPendingSetupStore(needsSetup);

      if (auditsRes.data) {
        setAudits(auditsRes.data as AuditLog[]);
        buildChart(auditsRes.data as AuditLog[]);
      }
    };
    fetchData();
  }, [user]);

  // Realtime for active state
  useEffect(() => {
    if (!user || dashState !== "active") return;
    const channel = supabase
      .channel("live-audits")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_logs" }, (payload) => {
        const newLog = payload.new as AuditLog;
        setAudits((prev) => [newLog, ...prev].slice(0, 50));
        setChartData((prev) => {
          const time = new Date(newLog.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
          return [...prev, { time, score: newLog.score || 0 }].slice(-20);
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, dashState]);

  const buildChart = (logs: AuditLog[]) => {
    const scored = logs.filter((l) => l.score !== null).reverse().slice(-20);
    setChartData(scored.map((l) => ({
      time: new Date(l.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      score: l.score || 0,
    })));
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "التاجر";

  // ── Loading State ──
  if (dashState === "loading") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 rounded bg-secondary animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
          </div>
          <TableSkeleton rows={5} />
        </div>
      </DashboardLayout>
    );
  }

  // ── No Subscription — Redirect to Onboarding ──
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

            <div className="grid grid-cols-3 gap-3 mb-8">
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

  // ── Pending Approval State ──
  if (dashState === "pending_approval") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-bold text-foreground font-arabic">مرحباً، {displayName}</h1>
          </motion.div>

          {/* Pending overlay */}
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

          {/* Demo Data Preview */}
          <div className="relative">
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-border">
                <p className="text-sm text-muted-foreground font-arabic">⏳ بانتظار مزامنة الكاميرا...</p>
              </div>
            </div>
            <div className="opacity-30 pointer-events-none">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Store} label="المتاجر النشطة" value="1" numericValue={1} change="تجريبي" changeType="neutral" glowColor="blue" />
                <StatCard icon={Eye} label="تدقيقات اليوم" value="--" change="بانتظار البيانات" changeType="neutral" glowColor="emerald" />
                <StatCard icon={BarChart3} label="متوسط النتيجة" value="--" change="لا توجد بيانات" changeType="neutral" glowColor="gold" />
                <StatCard icon={Cpu} label="الأجهزة" value="0/1" change="يحتاج إعداد" changeType="negative" glowColor="blue" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Active Dashboard ──
  const storeNameMap = Object.fromEntries(stores.map((s) => [s.id, s.name]));
  const todayAudits = audits.filter((a) => new Date(a.created_at).toDateString() === new Date().toDateString());
  const avgScore = todayAudits.length > 0
    ? Math.round(todayAudits.reduce((sum, a) => sum + (a.score || 0), 0) / todayAudits.length)
    : 0;

  const handleDispute = async (auditId: string) => {
    const { error } = await supabase.from("analytics_logs").update({ disputed: true }).eq("id", auditId);
    if (error) { toast.error("خطأ في تسجيل الطعن"); return; }
    toast.success("تم تسجيل الطعن — سيراجعها الفريق التقني");
    setAudits((prev) => prev.map((a) => a.id === auditId ? { ...a, disputed: true } : a));
  };

  const recentAudits = audits.slice(0, 5).map((a) => ({
    id: a.id,
    storeName: storeNameMap[a.store_id] || a.summary || "متجر",
    time: new Date(a.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    status: (a.status === "fail" ? "fail" : a.status === "warning" ? "warning" : "pass") as "pass" | "warning" | "fail",
    summary: a.result ? summarizeResult(a.result) : a.summary || "لا توجد تفاصيل",
    score: a.score || 0,
    disputed: (a as any).disputed ?? false,
  }));

  return (
    <DashboardLayout>
      {showWelcome && <WelcomeTutorial onClose={() => setShowWelcome(false)} />}
      <div className="space-y-6">
        {/* Broadcast Banner */}
        <BroadcastBanner />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-foreground font-arabic">مرحباً، {displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-arabic">نظرة عامة على العمليات التشغيلية لهذا اليوم</p>
        </motion.div>

        {pendingSetupStore && (
          <HardwareSetup
            storeId={pendingSetupStore.id}
            onComplete={() => {
              setPendingSetupStore(null);
              if (user) {
                supabase.from("stores").select("id, name, hardware_choice, is_active").eq("user_id", user.id).then(({ data }) => {
                  if (data) setStores(data);
                });
              }
            }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Store} label="المتاجر النشطة" value={String(stores.length)} numericValue={stores.length} change={stores.length > 0 ? "مُفعّلة" : "لا يوجد"} changeType="positive" glowColor="blue" />
          <StatCard icon={Eye} label="تدقيقات اليوم" value={String(todayAudits.length)} numericValue={todayAudits.length} change={todayAudits.length > 0 ? "مباشر" : "بانتظار البيانات"} changeType="positive" glowColor="emerald" />
          <StatCard icon={BarChart3} label="متوسط النتيجة" value={avgScore > 0 ? `${avgScore}%` : "--"} numericValue={avgScore > 0 ? avgScore : undefined} change={avgScore >= 80 ? "أداء ممتاز" : avgScore > 0 ? "يحتاج تحسين" : "لا توجد بيانات"} changeType={avgScore >= 80 ? "positive" : avgScore > 0 ? "negative" : "neutral"} glowColor="gold" />
          <StatCard icon={Cpu} label="الأجهزة" value={stores.filter((s) => s.hardware_choice).length + "/" + stores.length} change={pendingSetupStore ? "يحتاج إعداد" : "مكتمل"} changeType={pendingSetupStore ? "negative" : "positive"} glowColor="blue" />
        </div>

        <ComparativeChart audits={audits} />

        {/* Operating Hours Scheduler */}
        {stores.length > 0 && subscription && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stores.map((s) => (
              <OperatingHoursScheduler
                key={s.id}
                storeId={s.id}
                operatingHours={(s as any).operating_hours}
                subscriptionTier={subscription.tier}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground font-arabic">مؤشر الامتثال التشغيلي</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-arabic">أداء التدقيقات عبر جميع المتاجر</p>
              </div>
              {chartData.length > 1 && (
                <div className="flex items-center gap-1 text-emerald text-xs font-mono">
                  <TrendingUp className="w-3.5 h-3.5" /> مباشر
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(212, 100%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(212, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(0, 0%, 10%)" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 3.9%)", border: "1px solid hsl(0, 0%, 10%)", borderRadius: "8px", color: "hsl(0, 0%, 92%)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="score" stroke="hsl(212, 100%, 50%)" fill="url(#scoreGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground font-arabic">آخر التدقيقات</h3>
              <span className="text-[10px] text-emerald font-mono uppercase tracking-wider animate-pulse">● مباشر</span>
            </div>
            <div className="space-y-3">
              {recentAudits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm font-arabic">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  بانتظار بيانات من محرك سبلت
                </div>
              ) : (
                recentAudits.map((audit, i) => <AuditLogItem key={i} {...audit} onDispute={handleDispute} />)
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function summarizeResult(result: any): string {
  if (!result || typeof result !== "object") return "تدقيق مكتمل";
  const keys = Object.keys(result);
  const parts: string[] = [];
  for (const key of keys.slice(0, 3)) {
    parts.push(`${key}: ${result[key]}`);
  }
  return parts.join(" | ") || "تدقيق مكتمل";
}
