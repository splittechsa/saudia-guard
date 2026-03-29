import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, Server, AlertTriangle, Shield, Activity, CheckCircle, XCircle, Clock, Eye, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StoreRow {
  id: string;
  name: string;
  user_id: string;
  hardware_choice: string | null;
  is_active: boolean | null;
  custom_queries: any;
  query_status: string;
  created_at: string;
}

interface AlertRow {
  id: string;
  alert_type: string;
  message: string;
  store_id: string | null;
  resolved: boolean | null;
  created_at: string;
}

interface TicketRow {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  user_id: string;
  created_at: string;
}

interface SubRow {
  id: string;
  tier: string;
  price_sar: number;
  status: string;
}

export default function AdminDashboard() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "queries" | "alerts" | "tickets">("overview");

  useEffect(() => {
    fetchAll();
    // Realtime for security alerts
    const ch = supabase
      .channel("admin-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "security_alerts" }, (payload) => {
        setAlerts((prev) => [payload.new as AlertRow, ...prev]);
        toast.error("🚨 تنبيه أمني جديد!", { description: (payload.new as AlertRow).message });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const fetchAll = async () => {
    const [storesRes, alertsRes, ticketsRes, subsRes] = await Promise.all([
      supabase.from("stores").select("*").order("created_at", { ascending: false }),
      supabase.from("security_alerts").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("subscriptions").select("*").eq("status", "active"),
    ]);
    if (storesRes.data) setStores(storesRes.data as any[]);
    if (alertsRes.data) setAlerts(alertsRes.data as AlertRow[]);
    if (ticketsRes.data) setTickets(ticketsRes.data as TicketRow[]);
    if (subsRes.data) setSubs(subsRes.data as SubRow[]);
  };

  const mrr = subs.reduce((s, sub) => s + sub.price_sar, 0);
  const tierCounts = subs.reduce((acc, s) => { acc[s.tier] = (acc[s.tier] || 0) + 1; return acc; }, {} as Record<string, number>);
  const tierData = Object.entries(tierCounts).map(([name, value]) => ({
    name, value,
    color: name === "basic" ? "hsl(212, 100%, 50%)" : name === "pro" ? "hsl(160, 84%, 39%)" : "hsl(43, 76%, 53%)",
  }));

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const criticalAlerts = unresolvedAlerts.filter((a) => a.alert_type === "critical" || a.alert_type === "tampering");

  const handleQueryApproval = async (storeId: string, approved: boolean) => {
    await supabase.from("stores").update({ query_status: approved ? "approved" : "rejected" }).eq("id", storeId);
    toast.success(approved ? "تمت الموافقة على الاستعلامات" : "تم رفض الاستعلامات");
    fetchAll();
  };

  const handleTicketStatus = async (ticketId: string, status: string) => {
    await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
    toast.success("تم تحديث حالة التذكرة");
    fetchAll();
  };

  const tabs = [
    { id: "overview" as const, label: "نظرة عامة" },
    { id: "queries" as const, label: "إدارة الاستعلامات" },
    { id: "alerts" as const, label: `التنبيهات الأمنية (${unresolvedAlerts.length})` },
    { id: "tickets" as const, label: `تذاكر الدعم (${tickets.filter(t => t.status === "open").length})` },
  ];

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-arabic">لوحة تحكم المالك</h1>
            <p className="text-xs text-muted-foreground font-mono">splittechsa · صلاحيات كاملة</p>
          </div>
        </motion.div>

        {/* Critical Alert Banner */}
        {criticalAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-bold text-destructive font-arabic">⚠️ تنبيهات حرجة: {criticalAlerts.length}</p>
              <p className="text-xs text-destructive/80 font-arabic">{criticalAlerts[0]?.message}</p>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="إجمالي التجار" value={String(new Set(stores.map(s => s.user_id)).size)} change={`${stores.length} متجر`} changeType="positive" glowColor="blue" />
          <StatCard icon={DollarSign} label="الإيرادات الشهرية" value={`${mrr.toLocaleString("ar-SA")} ر.س`} change={`${subs.length} اشتراك نشط`} changeType="positive" glowColor="gold" />
          <StatCard icon={Server} label="الأجهزة النشطة" value={String(stores.filter(s => s.hardware_choice).length)} change={`${stores.filter(s => !s.hardware_choice).length} بدون جهاز`} changeType={stores.some(s => !s.hardware_choice) ? "negative" : "positive"} glowColor="emerald" />
          <StatCard icon={AlertTriangle} label="التنبيهات الأمنية" value={String(unresolvedAlerts.length)} change={criticalAlerts.length > 0 ? `${criticalAlerts.length} حرجة` : "لا توجد"} changeType={criticalAlerts.length > 0 ? "negative" : "positive"} glowColor="blue" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-arabic whitespace-nowrap transition-all ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-xl bg-card border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 font-arabic">المتاجر المسجلة</h3>
              <div className="space-y-2">
                {stores.slice(0, 10).map((store) => (
                  <div key={store.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                    <div>
                      <span className="text-sm font-semibold text-foreground font-arabic">{store.name}</span>
                      <p className="text-[10px] text-muted-foreground font-mono">{store.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${store.hardware_choice ? "text-emerald border-emerald/30" : "text-accent border-accent/30"}`}>
                        {store.hardware_choice || "بدون جهاز"}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${store.is_active ? "bg-emerald" : "bg-destructive"}`} />
                    </div>
                  </div>
                ))}
                {stores.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8 font-arabic">لا توجد متاجر مسجلة بعد</p>
                )}
              </div>
            </motion.div>

            {tierData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl bg-card border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 font-arabic">توزيع الباقات</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={tierData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {tierData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
            )}
          </div>
        )}

        {activeTab === "queries" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="text-sm text-muted-foreground font-arabic">مراجعة والموافقة على استعلامات التدقيق المخصصة من التجار</p>
            {stores.filter(s => s.custom_queries && (s.custom_queries as any[]).length > 0).map((store) => (
              <div key={store.id} className="rounded-xl bg-card border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-foreground font-arabic">{store.name}</h4>
                    <Badge variant="outline" className={`text-[10px] mt-1 ${
                      store.query_status === "approved" ? "text-emerald border-emerald/30" : store.query_status === "rejected" ? "text-destructive border-destructive/30" : "text-accent border-accent/30"
                    }`}>
                      {store.query_status === "approved" ? "معتمد" : store.query_status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleQueryApproval(store.id, true)} className="text-emerald border-emerald/30 hover:bg-emerald/10 font-arabic text-xs">
                      <CheckCircle className="w-3 h-3 me-1" /> موافقة
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleQueryApproval(store.id, false)} className="text-destructive border-destructive/30 hover:bg-destructive/10 font-arabic text-xs">
                      <XCircle className="w-3 h-3 me-1" /> رفض
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  {(store.custom_queries as string[])?.map((q, i) => (
                    <p key={i} className="text-xs text-muted-foreground font-arabic bg-secondary/30 rounded px-3 py-2">{q}</p>
                  ))}
                </div>
              </div>
            ))}
            {stores.filter(s => s.custom_queries && (s.custom_queries as any[]).length > 0).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8 font-arabic">لا توجد استعلامات مخصصة للمراجعة</p>
            )}
          </motion.div>
        )}

        {activeTab === "alerts" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                alert.alert_type === "critical" || alert.alert_type === "tampering" ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
              }`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 ${
                  alert.alert_type === "critical" || alert.alert_type === "tampering" ? "text-destructive" : alert.alert_type === "warning" ? "text-accent" : "text-primary"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground font-arabic">{alert.alert_type}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(alert.created_at).toLocaleString("ar-SA")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-arabic">{alert.message}</p>
                </div>
                {(alert.alert_type === "critical" || alert.alert_type === "tampering") && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-destructive animate-pulse">حرج</span>
                )}
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8 font-arabic">لا توجد تنبيهات أمنية</p>
            )}
          </motion.div>
        )}

        {activeTab === "tickets" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl bg-card border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-bold text-foreground font-arabic">{ticket.subject}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground font-arabic line-clamp-2">{ticket.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">
                      {new Date(ticket.created_at).toLocaleString("ar-SA")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant="outline" className={`text-[10px] ${
                      ticket.priority === "high" ? "text-destructive border-destructive/30" : ticket.priority === "medium" ? "text-accent border-accent/30" : "text-emerald border-emerald/30"
                    }`}>
                      {ticket.priority === "high" ? "عالية" : ticket.priority === "medium" ? "متوسطة" : "منخفضة"}
                    </Badge>
                    <div className="flex gap-1">
                      {ticket.status === "open" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleTicketStatus(ticket.id, "in_progress")} className="text-xs font-arabic h-7 px-2">جاري العمل</Button>
                          <Button size="sm" variant="outline" onClick={() => handleTicketStatus(ticket.id, "resolved")} className="text-xs text-emerald font-arabic h-7 px-2">حل</Button>
                        </>
                      )}
                      {ticket.status === "in_progress" && (
                        <Button size="sm" variant="outline" onClick={() => handleTicketStatus(ticket.id, "resolved")} className="text-xs text-emerald font-arabic h-7 px-2">تم الحل</Button>
                      )}
                      {ticket.status === "resolved" && (
                        <Badge variant="outline" className="text-[10px] text-emerald border-emerald/30">✓ تم الحل</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8 font-arabic">لا توجد تذاكر دعم</p>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
