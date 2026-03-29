import { motion } from "framer-motion";
import { Users, DollarSign, Server, AlertTriangle, Shield, Activity } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const revenueData = [
  { month: "Jan", revenue: 12400 }, { month: "Feb", revenue: 15600 },
  { month: "Mar", revenue: 18200 }, { month: "Apr", revenue: 21300 },
  { month: "May", revenue: 24100 }, { month: "Jun", revenue: 28900 },
];

const tierData = [
  { name: "Basic", value: 45, color: "hsl(212, 100%, 50%)" },
  { name: "Pro", value: 32, color: "hsl(160, 84%, 39%)" },
  { name: "Enterprise", value: 12, color: "hsl(43, 76%, 53%)" },
];

const alerts = [
  { id: 1, type: "critical", store: "Split Cuts - Khobar", message: "Integrity violation: Unauthorized camera access attempt", time: "5 min ago" },
  { id: 2, type: "warning", store: "Al-Faisal Market", message: "Hardware offline for 2+ hours", time: "1 hr ago" },
  { id: 3, type: "info", store: "System", message: "New merchant onboarded: Riyadh Café", time: "3 hrs ago" },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Super-Owner Console</h1>
            <p className="text-xs text-muted-foreground font-mono">hamada1 · Full Access</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Merchants" value="89" change="+7 this month" changeType="positive" glowColor="blue" />
          <StatCard icon={DollarSign} label="MRR" value="28,900 SAR" change="+18.3% growth" changeType="positive" glowColor="gold" />
          <StatCard icon={Server} label="Active Devices" value="142" change="3 offline" changeType="negative" glowColor="emerald" />
          <StatCard icon={AlertTriangle} label="Security Alerts" value="2" change="1 critical" changeType="negative" glowColor="blue" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 rounded-xl bg-card border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Monthly Revenue</h3>
            <p className="text-xs text-muted-foreground mb-4">Subscription revenue trend (SAR)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid stroke="hsl(0, 0%, 10%)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 3.9%)", border: "1px solid hsl(0, 0%, 10%)", borderRadius: "8px", color: "hsl(0, 0%, 92%)", fontSize: "12px" }} />
                <Bar dataKey="revenue" fill="hsl(43, 76%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Tier Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl bg-card border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Subscription Tiers</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={tierData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {tierData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {tierData.map((t) => (
                <div key={t.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-[11px] text-muted-foreground">{t.name} ({t.value})</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Security Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Security & System Alerts</h3>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                alert.type === "critical" ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
              }`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 ${
                  alert.type === "critical" ? "text-destructive" : alert.type === "warning" ? "text-accent" : "text-primary"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{alert.store}</span>
                    <span className="text-xs text-muted-foreground font-mono">{alert.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                </div>
                {alert.type === "critical" && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-destructive animate-pulse">CRITICAL</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
