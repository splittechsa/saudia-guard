import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store, Eye, Cpu, Clock, Rocket, Camera, ClipboardCheck, CreditCard,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle, Wifi, WifiOff,
  ChevronDown, ChevronUp
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import HardwareSetup from "@/components/dashboard/HardwareSetup";
import { WelcomeTutorial } from "@/components/dashboard/WelcomeTutorial";
import { MerchantControlPanel } from "@/components/dashboard/MerchantControlPanel";
import { CustomQuestionsEditor } from "@/components/dashboard/CustomQuestionsEditor";
import { BroadcastBanner } from "@/components/dashboard/BroadcastBanner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/carbon-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StoreData {
  id: string;
  name: string;
  hardware_choice: string | null;
  is_active: boolean | null;
  operating_hours?: any;
  store_status?: string;
  whatsapp_enabled?: boolean;
  custom_queries?: any;
  query_status?: string;
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
  ai_reasoning: string | null;
  confidence_score: number | null;
  created_at: string;
  disputed?: boolean;
}

type DashState = "loading" | "no_subscription" | "pending_approval" | "active";

// ── Relative time helper ──
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

// ── Extract Q&A pairs from observations/result ──
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

// ── Check if audit has meaningful content ──
function hasFindings(entry: AuditLog): boolean {
  return extractQA(entry).length > 0;
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
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  useEffect(() => {
    if (hasRole("super_owner")) { navigate("/admin", { replace: true }); return; }
    if (hasRole("it_support")) { navigate("/it-dashboard", { replace: true }); return; }
  }, [hasRole, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [storesRes, subsRes, auditsRes] = await Promise.all([
        supabase.from("stores").select("id, name, hardware_choice, is_active, operating_hours, store_status, whatsapp_enabled, custom_queries, query_status").eq("user_id", user.id),
        supabase.from("subscriptions").select("id, tier, status, price_sar").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("analytics_logs").select("id, store_id, score, status, summary, result, observations, ai_reasoning, confidence_score, created_at, disputed").order("created_at", { ascending: false }).limit(100),
      ]);

      const storesData = storesRes.data || [];
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
      if (auditsRes.data) setAudits(auditsRes.data as AuditLog[]);
    };
    fetchData();
  }, [user]);

  // Realtime
  useEffect(() => {
    if (!user || dashState !== "active") return;
    const channel = supabase
      .channel("live-audits")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_logs" }, (payload) => {
        setAudits((prev) => [payload.new as AuditLog, ...prev].slice(0, 100));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, dashState]);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "التاجر";

  // ── Derived data ──
  const todayStart = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const todayAudits = useMemo(() => audits.filter(a => new Date(a.created_at) >= todayStart), [audits, todayStart]);
  const todayWithFindings = useMemo(() => todayAudits.filter(hasFindings), [todayAudits]);

  const avgScore = useMemo(() => {
    const scored = todayAudits.filter(a => a.score !== null);
    return scored.length > 0 ? Math.round(scored.reduce((s, a) => s + (a.score || 0), 0) / scored.length) : 0;
  }, [todayAudits]);

  // Most frequent failed question today
  const topFailure = useMemo(() => {
    const failCounts: Record<string, number> = {};
    let totalAudits = 0;
    for (const a of todayAudits) {
      const qa = extractQA(a);
      if (qa.length > 0) totalAudits++;
      for (const { question, positive } of qa) {
        if (!positive && question) {
          failCounts[question] = (failCounts[question] || 0) + 1;
        }
      }
    }
    const sorted = Object.entries(failCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    return { question: sorted[0][0], count: sorted[0][1], total: totalAudits };
  }, [todayAudits]);

  // 24h chart data
  const chartData = useMemo(() => {
    const scored = todayAudits.filter(a => a.score !== null).reverse();
    return scored.map(a => ({
      time: new Date(a.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      score: a.score || 0,
    }));
  }, [todayAudits]);

  // Latest audit for Live Pulse
  const latestAudit = audits.length > 0 ? audits[0] : null;
  const isConnected = latestAudit ? (Date.now() - new Date(latestAudit.created_at).getTime()) < 30 * 60 * 1000 : false;

  const handleDispute = async (auditId: string) => {
    const { error } = await supabase.from("analytics_logs").update({ disputed: true }).eq("id", auditId);
    if (error) { toast.error("خطأ في تسجيل الطعن"); return; }
    toast.success("تم تسجيل الطعن — سيراجعها الفريق التقني");
    setAudits(prev => prev.map(a => a.id === auditId ? { ...a, disputed: true } : a));
  };

  // ── Loading ──
  if (dashState === "loading") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 rounded bg-secondary animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
          </div>
          <TableSkeleton rows={5} />
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
  // ═══  ACTIVE DASHBOARD — Decision-Making Tool  ═══
  // ══════════════════════════════════════════════════

  const storeNameMap = Object.fromEntries(stores.map(s => [s.id, s.name]));

  return (
    <DashboardLayout>
      {showWelcome && <WelcomeTutorial onClose={() => setShowWelcome(false)} />}
      <div className="space-y-5">
        <BroadcastBanner />

        {/* ── 1. LIVE PULSE BAR ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card border border-border p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse" />
                <Wifi className="w-4 h-4 text-emerald" />
                <span className="text-sm font-semibold text-emerald font-arabic">المحل متصل</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <WifiOff className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive font-arabic">المحل غير متصل</span>
              </div>
            )}
          </div>
          {latestAudit && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground font-arabic">آخر جولة: {timeAgo(latestAudit.created_at)}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={Eye} label="جولات اليوم" value={String(todayWithFindings.length)} numericValue={todayWithFindings.length} change={todayWithFindings.length > 0 ? "جولة مع نتائج" : "بانتظار البيانات"} changeType={todayWithFindings.length > 0 ? "positive" : "neutral"} glowColor="blue" />
            <StatCard icon={TrendingUp} label="نسبة الانضباط" value={avgScore > 0 ? `${avgScore}%` : "--"} numericValue={avgScore > 0 ? avgScore : undefined} change={avgScore >= 80 ? "أداء ممتاز" : avgScore > 0 ? "يحتاج تحسين" : "لا توجد بيانات"} changeType={avgScore >= 80 ? "positive" : avgScore > 0 ? "negative" : "neutral"} glowColor={avgScore >= 80 ? "emerald" : "gold"} />
            <StatCard icon={Cpu} label="الأجهزة" value={stores.filter(s => s.hardware_choice).length + "/" + stores.length} change={pendingSetupStore ? "يحتاج إعداد" : "مكتمل"} changeType={pendingSetupStore ? "negative" : "positive"} glowColor="blue" />
          </div>
        </div>

        {pendingSetupStore && (
          <HardwareSetup storeId={pendingSetupStore.id} onComplete={() => {
            setPendingSetupStore(null);
            if (user) supabase.from("stores").select("id, name, hardware_choice, is_active, operating_hours, store_status, whatsapp_enabled").eq("user_id", user.id).then(({ data }) => { if (data) setStores(data); });
          }} />
        )}

        {/* ── 3. ACTIONABLE INSIGHTS ── */}
        {topFailure && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground font-arabic">أبرز مخالفة متكررة اليوم</p>
              <p className="text-sm text-muted-foreground font-arabic mt-1">
                "{topFailure.question}" — تم رصدها في <span className="text-destructive font-bold">{topFailure.count}</span> من أصل <span className="font-bold">{topFailure.total}</span> جولة اليوم
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

        {/* ── 5. AUDIT TIMELINE ── */}
        <div>
          <h2 className="text-lg font-bold text-foreground font-arabic mb-3 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            الخط الزمني للجولات
          </h2>

          {todayWithFindings.length === 0 ? (
            <div className="rounded-xl bg-card border border-border p-8 text-center">
              <Eye className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground font-arabic">لا توجد جولات بنتائج حتى الآن اليوم</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayWithFindings.slice(0, 10).map((audit) => {
                const qa = extractQA(audit);
                const positiveCount = qa.filter(q => q.positive).length;
                const negativeCount = qa.filter(q => !q.positive).length;
                const isExpanded = expandedAudit === audit.id;
                const storeName = storeNameMap[audit.store_id] || "المتجر";

                return (
                  <motion.div key={audit.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${
                      (audit.score || 0) >= 80 ? "bg-emerald/5 border-emerald/20" :
                      (audit.score || 0) >= 50 ? "bg-accent/5 border-accent/20" :
                      "bg-destructive/5 border-destructive/20"
                    }`}
                    onClick={() => setExpandedAudit(isExpanded ? null : audit.id)}>

                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${
                          (audit.score || 0) >= 80 ? "bg-emerald" :
                          (audit.score || 0) >= 50 ? "bg-accent" : "bg-destructive"
                        }`} />
                        <div>
                          <span className="text-xs text-muted-foreground font-arabic">{timeAgo(audit.created_at)} — {storeName}</span>
                          <p className="text-sm font-semibold text-foreground font-arabic mt-0.5">
                            {audit.summary || (negativeCount > 0 ? `تم رصد ${negativeCount} ملاحظة` : "العمليات ممتازة")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {audit.score !== null && (
                          <span className={`text-lg font-bold font-mono ${
                            audit.score >= 80 ? "text-emerald" :
                            audit.score >= 50 ? "text-accent" : "text-destructive"
                          }`}>{audit.score}%</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Quick count */}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {positiveCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {positiveCount} إيجابي
                        </span>
                      )}
                      {negativeCount > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="w-3.5 h-3.5" /> {negativeCount} سلبي
                        </span>
                      )}
                    </div>

                    {/* Expanded Q&A */}
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        className="mt-4 pt-3 border-t border-border space-y-2">
                        {qa.map((item, i) => (
                          <div key={i} className="flex items-start justify-between gap-2 py-1.5">
                            <span className="text-sm text-muted-foreground font-arabic flex-1">{item.question}</span>
                            <span className={`text-sm font-bold font-arabic shrink-0 flex items-center gap-1 ${item.positive ? "text-emerald" : "text-destructive"}`}>
                              {item.positive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {item.answer}
                            </span>
                          </div>
                        ))}
                        {!audit.disputed && (
                          <Button size="sm" variant="outline" className="mt-2 text-xs font-arabic border-accent/30 text-accent hover:bg-accent/10"
                            onClick={(e) => { e.stopPropagation(); handleDispute(audit.id); }}>
                            الطعن في هذه النتيجة
                          </Button>
                        )}
                        {audit.disputed && (
                          <span className="text-xs text-accent font-arabic">✓ تم تسجيل الطعن</span>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 6. MERCHANT CONTROL PANEL ── */}
        {stores.length > 0 && subscription && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {stores.map(s => (
                <MerchantControlPanel key={s.id}
                  store={{ id: s.id, name: s.name, is_active: s.is_active, operating_hours: s.operating_hours, whatsapp_enabled: s.whatsapp_enabled }}
                  subscriptionTier={subscription.tier}
                  onUpdate={() => {
                    if (user) supabase.from("stores").select("id, name, hardware_choice, is_active, operating_hours, store_status, whatsapp_enabled, custom_queries, query_status").eq("user_id", user.id).then(({ data }) => { if (data) setStores(data); });
                  }}
                />
              ))}
            </div>

            {/* ── 7. CUSTOM QUESTIONS EDITOR ── */}
            {stores.map(s => (
              <CustomQuestionsEditor
                key={`q-${s.id}`}
                storeId={s.id}
                initialQueries={s.custom_queries}
                queryStatus={s.query_status || "approved"}
                isAdmin={false}
                onSave={() => {
                  if (user) supabase.from("stores").select("id, name, hardware_choice, is_active, operating_hours, store_status, whatsapp_enabled, custom_queries, query_status").eq("user_id", user.id).then(({ data }) => { if (data) setStores(data); });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
