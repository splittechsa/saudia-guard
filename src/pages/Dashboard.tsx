import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, BarChart3, Shield, TrendingUp, Eye, Cpu, Clock, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { AuditLogItem } from "@/components/ui/audit-log-item";
import HardwareSetup from "@/components/dashboard/HardwareSetup";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StoreData {
  id: string;
  name: string;
  hardware_choice: string | null;
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

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [pendingSetupStore, setPendingSetupStore] = useState<StoreData | null>(null);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [chartData, setChartData] = useState<{ time: string; score: number }[]>([]);

  // Fetch stores & audits
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [storesRes, auditsRes] = await Promise.all([
        supabase.from("stores").select("id, name, hardware_choice").eq("user_id", user.id),
        supabase.from("analytics_logs").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      if (storesRes.data) {
        setStores(storesRes.data);
        const needsSetup = storesRes.data.find((s: StoreData) => !s.hardware_choice);
        if (needsSetup) setPendingSetupStore(needsSetup);
      }
      if (auditsRes.data) {
        setAudits(auditsRes.data as AuditLog[]);
        buildChart(auditsRes.data as AuditLog[]);
      }
    };
    fetchData();
  }, [user]);

  // Realtime subscription for live audit updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("live-audits")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_logs" }, (payload) => {
        const newLog = payload.new as AuditLog;
        setAudits((prev) => [newLog, ...prev].slice(0, 50));
        setChartData((prev) => {
          const time = new Date(newLog.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
          const updated = [...prev, { time, score: newLog.score || 0 }];
          return updated.slice(-20);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const buildChart = (logs: AuditLog[]) => {
    const scored = logs.filter((l) => l.score !== null).reverse().slice(-20);
    setChartData(
      scored.map((l) => ({
        time: new Date(l.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        score: l.score || 0,
      }))
    );
  };

  const storeNameMap = Object.fromEntries(stores.map((s) => [s.id, s.name]));
  const todayAudits = audits.filter((a) => {
    const d = new Date(a.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const avgScore = todayAudits.length > 0
    ? Math.round(todayAudits.reduce((sum, a) => sum + (a.score || 0), 0) / todayAudits.length)
    : 0;

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "التاجر";

  const recentAudits = audits.slice(0, 5).map((a) => ({
    storeName: storeNameMap[a.store_id] || a.summary || "متجر",
    time: new Date(a.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    status: (a.status === "fail" ? "fail" : a.status === "warning" ? "warning" : "pass") as "pass" | "warning" | "fail",
    summary: a.result ? summarizeResult(a.result) : a.summary || "لا توجد تفاصيل",
    score: a.score || 0,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
                supabase.from("stores").select("id, name, hardware_choice").eq("user_id", user.id).then(({ data }) => {
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
                recentAudits.map((audit, i) => (
                  <AuditLogItem key={i} {...audit} />
                ))
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
