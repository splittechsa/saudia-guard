import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, BarChart3, Shield, TrendingUp, Eye, Cpu } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { AuditLogItem } from "@/components/ui/audit-log-item";
import HardwareSetup from "@/components/dashboard/HardwareSetup";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const chartData = [
  { time: "06:00", score: 82 }, { time: "08:00", score: 91 },
  { time: "10:00", score: 88 }, { time: "12:00", score: 75 },
  { time: "14:00", score: 93 }, { time: "16:00", score: 89 },
  { time: "18:00", score: 95 }, { time: "20:00", score: 87 },
  { time: "22:00", score: 92 },
];

const recentAudits = [
  { storeName: "Split Cuts - Riyadh", time: "2 min ago", status: "pass" as const, summary: "All 10 checkpoints passed. Staff compliance 100%.", score: 98 },
  { storeName: "Split Cuts - Jeddah", time: "15 min ago", status: "warning" as const, summary: "Table 3 needs cleaning. Staff phone usage detected.", score: 72 },
  { storeName: "Split Cuts - Dammam", time: "32 min ago", status: "pass" as const, summary: "Excellent presentation. Customer flow optimal.", score: 95 },
];

interface StoreData {
  id: string;
  name: string;
  hardware_choice: string | null;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [pendingSetupStore, setPendingSetupStore] = useState<StoreData | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [storesRes, subRes] = await Promise.all([
        supabase.from("stores").select("id, name, hardware_choice").eq("user_id", user.id),
        supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      ]);
      if (storesRes.data) {
        setStores(storesRes.data);
        const needsSetup = storesRes.data.find((s: StoreData) => !s.hardware_choice);
        if (needsSetup) setPendingSetupStore(needsSetup);
      }
      if (subRes.data) setSubscription(subRes.data);
    };
    fetchData();
  }, [user]);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Merchant";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's your operational overview for today.</p>
        </motion.div>

        {/* Hardware Setup Prompt (shows after subscription if not configured) */}
        {pendingSetupStore && (
          <HardwareSetup
            storeId={pendingSetupStore.id}
            onComplete={() => {
              setPendingSetupStore(null);
              // Refresh stores
              if (user) {
                supabase.from("stores").select("id, name, hardware_choice").eq("user_id", user.id).then(({ data }) => {
                  if (data) setStores(data);
                });
              }
            }}
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Store} label="Active Stores" value={String(stores.length)} change={stores.length > 0 ? "configured" : "none yet"} changeType="positive" glowColor="blue" />
          <StatCard icon={Eye} label="Audits Today" value="0" change="awaiting setup" changeType="positive" glowColor="emerald" />
          <StatCard icon={BarChart3} label="Avg Score" value="--" change="no data yet" changeType="positive" glowColor="gold" />
          <StatCard icon={Cpu} label="Hardware" value={stores.filter(s => s.hardware_choice).length + "/" + stores.length} change={pendingSetupStore ? "setup needed" : "all configured"} changeType={pendingSetupStore ? "negative" : "positive"} glowColor="blue" />
        </div>

        {/* Chart + Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Compliance Score Trend</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Today's audit performance across all stores</p>
              </div>
              <div className="flex items-center gap-1 text-emerald text-xs font-mono">
                <TrendingUp className="w-3.5 h-3.5" /> +5.2%
              </div>
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
                <YAxis domain={[60, 100]} tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 3.9%)", border: "1px solid hsl(0, 0%, 10%)", borderRadius: "8px", color: "hsl(0, 0%, 92%)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="score" stroke="hsl(212, 100%, 50%)" fill="url(#scoreGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Recent Audits</h3>
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Live</span>
            </div>
            <div className="space-y-3">
              {recentAudits.map((audit, i) => (
                <AuditLogItem key={i} {...audit} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
