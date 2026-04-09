import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, Server, AlertTriangle, Shield, CheckCircle, XCircle, Clock, Eye, MessageSquare, UserPlus, Search, Cpu, Wifi, WifiOff, Key, Copy, Activity, Store, Megaphone, Send } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/carbon-skeleton";
import UserManagement from "@/components/admin/UserManagement";
import TicketChat from "@/components/tickets/TicketChat";
import { useAuth } from "@/hooks/useAuth";

interface StoreRow {
  id: string;
  name: string;
  user_id: string;
  hardware_choice: string | null;
  is_active: boolean | null;
  store_status: string;
  custom_queries: any;
  query_status: string;
  created_at: string;
  reviewed_at: string | null;
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
  user_id: string;
  tier: string;
  price_sar: number;
  status: string;
  created_at: string;
}

interface LiveAudit {
  id: string;
  store_id: string;
  score: number | null;
  status: string | null;
  summary: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [pendingSubs, setPendingSubs] = useState<SubRow[]>([]);
  const [liveAudits, setLiveAudits] = useState<LiveAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "surveillance" | "engines" | "users" | "queries" | "approvals" | "alerts" | "tickets" | "broadcast">("overview");
  const [apiKeys, setApiKeys] = useState<Record<string, { api_key: string; is_active: boolean }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "security_alerts" }, (payload) => {
        setAlerts((prev) => [payload.new as AlertRow, ...prev]);
        toast.error("🚨 تنبيه أمني جديد!", { description: (payload.new as AlertRow).message });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_logs" }, (payload) => {
        const newAudit = payload.new as LiveAudit;
        setLiveAudits((prev) => [newAudit, ...prev].slice(0, 30));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "subscriptions" }, (payload) => {
        const newSub = payload.new as SubRow;
        if (newSub.status === "pending") {
          setPendingSubs((prev) => [newSub, ...prev]);
          toast.info("📋 طلب اشتراك جديد!", { description: `باقة ${newSub.tier}` });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [storesRes, alertsRes, ticketsRes, subsRes, pendingSubsRes, auditsRes, apiKeysRes] = await Promise.all([
      supabase.from("stores").select("*").order("created_at", { ascending: false }),
      supabase.from("security_alerts").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("subscriptions").select("*").eq("status", "active"),
      supabase.from("subscriptions").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("analytics_logs").select("id, store_id, score, status, summary, created_at").order("created_at", { ascending: false }).limit(30),
      supabase.from("store_api_keys").select("store_id, api_key, is_active"),
    ]);

    const firstError = storesRes.error || alertsRes.error || ticketsRes.error || subsRes.error || pendingSubsRes.error || auditsRes.error || apiKeysRes.error;
    if (firstError) {
      toast.error(`فشل تحميل لوحة الإدارة: ${firstError.message}`);
      setLoading(false);
      return;
    }

    if (storesRes.data) setStores(storesRes.data as any[]);
    if (alertsRes.data) setAlerts(alertsRes.data as AlertRow[]);
    if (ticketsRes.data) setTickets(ticketsRes.data as TicketRow[]);
    if (subsRes.data) setSubs(subsRes.data as SubRow[]);
    if (pendingSubsRes.data) setPendingSubs(pendingSubsRes.data as SubRow[]);
    if (auditsRes.data) setLiveAudits(auditsRes.data as LiveAudit[]);
    if (apiKeysRes.data) {
      const keysMap: Record<string, { api_key: string; is_active: boolean }> = {};
      (apiKeysRes.data as any[]).forEach((k: any) => { keysMap[k.store_id] = { api_key: k.api_key, is_active: k.is_active }; });
      setApiKeys(keysMap);
    }
    setLoading(false);
  };

  const mrr = subs.reduce((s, sub) => s + sub.price_sar, 0);
  const tierCounts = subs.reduce((acc, s) => { acc[s.tier] = (acc[s.tier] || 0) + 1; return acc; }, {} as Record<string, number>);
  const tierData = Object.entries(tierCounts).map(([name, value]) => ({
    name, value,
    color: name === "basic" ? "hsl(212, 100%, 50%)" : name === "pro" ? "hsl(160, 84%, 39%)" : "hsl(43, 76%, 53%)",
  }));

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const criticalAlerts = unresolvedAlerts.filter((a) => a.alert_type === "critical" || a.alert_type === "tampering");
  const storeNameMap = Object.fromEntries(stores.map((s) => [s.id, s.name]));

  // Store lifecycle stats
  const draftStores = stores.filter(s => s.store_status === "draft" || !s.store_status);
  const pendingReviewStores = stores.filter(s => s.store_status === "pending_review");
  const activeStores = stores.filter(s => s.store_status === "active");
  const suspendedStores = stores.filter(s => s.store_status === "suspended");

  // IT performance: stores approved today
  const todayStr = new Date().toDateString();
  const approvedToday = stores.filter(s => s.reviewed_at && new Date(s.reviewed_at).toDateString() === todayStr).length;
  const pendingTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;

  const storeLastAudit = liveAudits.reduce((acc, a) => {
    if (!acc[a.store_id] || new Date(a.created_at) > new Date(acc[a.store_id])) {
      acc[a.store_id] = a.created_at;
    }
    return acc;
  }, {} as Record<string, string>);

  const getEngineStatus = (storeId: string) => {
    const lastAudit = storeLastAudit[storeId];
    if (!lastAudit) return "offline";
    const diffMin = (Date.now() - new Date(lastAudit).getTime()) / 60000;
    if (diffMin <= 15) return "online";
    if (diffMin <= 30) return "warning";
    return "offline";
  };

  const handleGenerateApiKey = async (storeId: string) => {
    const { error } = await supabase.from("store_api_keys").insert({ store_id: storeId });
    if (error && error.code === "23505") {
      toast.error("المفتاح موجود مسبقاً لهذا المتجر");
    } else if (error) {
      toast.error("خطأ في إنشاء المفتاح");
    } else {
      toast.success("تم إنشاء API Key بنجاح");
      fetchAll();
    }
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("تم نسخ المفتاح");
  };

  const handleQueryApproval = async (storeId: string, approved: boolean) => {
    await supabase.from("stores").update({ query_status: approved ? "approved" : "rejected" }).eq("id", storeId);
    toast.success(approved ? "تمت الموافقة على الاستعلامات" : "تم رفض الاستعلامات");
    fetchAll();
  };

  const handleSubscriptionApproval = async (subId: string, userId: string, approved: boolean) => {
    if (approved) {
      const { error: subError } = await supabase.from("subscriptions").update({ status: "active" }).eq("id", subId);
      if (subError) {
        toast.error(`فشل تفعيل الاشتراك: ${subError.message}`);
        return;
      }

      const { error: storeError } = await supabase.from("stores").update({ is_active: true, store_status: "active" }).eq("user_id", userId);
      if (storeError) {
        toast.error(`فشل تفعيل المتاجر: ${storeError.message}`);
        return;
      }
      toast.success("✅ تم تفعيل الاشتراك والمتاجر");
    } else {
      const { error: subError } = await supabase.from("subscriptions").update({ status: "inactive" }).eq("id", subId);
      if (subError) {
        toast.error(`فشل رفض الاشتراك: ${subError.message}`);
        return;
      }

      const { error: storeError } = await supabase.from("stores").update({ is_active: false, store_status: "suspended" }).eq("user_id", userId);
      if (storeError) {
        toast.error(`فشل تعليق المتاجر: ${storeError.message}`);
        return;
      }

      toast.success("تم رفض طلب الاشتراك");
    }
    fetchAll();
  };

  const handleTicketStatus = async (ticketId: string, status: string) => {
    await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
    toast.success("تم تحديث حالة التذكرة");
    setSelectedTicket(null);
    fetchAll();
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMsg.trim()) { toast.error("اكتب رسالة البث أولاً"); return; }
    if (!user) return;
    setSendingBroadcast(true);
    const { error } = await supabase.from("broadcasts").insert({
      sender_id: user.id,
      message: broadcastMsg.trim(),
      target_role: broadcastTarget,
    });
    if (error) { toast.error("فشل إرسال البث"); }
    else {
      toast.success("📢 تم إرسال البث لجميع المستخدمين");
      setBroadcastMsg("");
    }
    setSendingBroadcast(false);
  };

  const tierNameAr = (tier: string) => tier === "basic" ? "أساسي" : tier === "pro" ? "احترافي" : "مؤسسي";

  const tabs = [
    { id: "overview" as const, label: "نظرة عامة", icon: Shield },
    { id: "surveillance" as const, label: "عين الإدارة", icon: Eye },
    { id: "engines" as const, label: "المحركات", icon: Cpu },
    { id: "users" as const, label: "المستخدمين", icon: Users },
    { id: "broadcast" as const, label: "مركز البث", icon: Megaphone },
    { id: "approvals" as const, label: `الطلبات (${pendingSubs.length})`, icon: UserPlus },
    { id: "queries" as const, label: "اعتمادات المتاجر", icon: CheckCircle },
    { id: "alerts" as const, label: `التنبيهات (${unresolvedAlerts.length})`, icon: AlertTriangle },
    { id: "tickets" as const, label: `التذاكر (${tickets.filter(t => t.status === "open").length})`, icon: MessageSquare },
  ];

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-arabic">لوحة تحكم المالك</h1>
            <p className="text-xs text-muted-foreground font-mono">splittechsa · صلاحيات كاملة</p>
          </div>
        </motion.div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن متجر، تذكرة، أو معرّف عميل..."
            className="w-full bg-card border border-border rounded-xl py-2.5 pr-10 pl-4 text-sm text-foreground font-arabic placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {pendingSubs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-accent/10 border border-accent/30 p-4 flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-accent animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-bold text-accent font-arabic">📋 {pendingSubs.length} طلب اشتراك جديد بانتظار الموافقة</p>
              <p className="text-xs text-accent/80 font-arabic">انتقل لتبويب "الطلبات" للمراجعة والتفعيل</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("approvals")} className="text-accent border-accent/30 hover:bg-accent/10 font-arabic text-xs">
              مراجعة الطلبات
            </Button>
          </motion.div>
        )}

        {criticalAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-bold text-destructive font-arabic">⚠️ تنبيهات حرجة: {criticalAlerts.length}</p>
              <p className="text-xs text-destructive/80 font-arabic">{criticalAlerts[0]?.message}</p>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="إجمالي التجار" value={String(new Set(stores.map(s => s.user_id)).size)} change={`${stores.length} متجر`} changeType="positive" glowColor="blue" />
            <StatCard icon={DollarSign} label="الإيرادات الشهرية" value={`${mrr.toLocaleString("ar-SA")} ر.س`} change={`${subs.length} اشتراك نشط`} changeType="positive" glowColor="gold" />
            <StatCard icon={Store} label="دورة الحياة" value={`${activeStores.length} نشط`} change={`${pendingReviewStores.length} بانتظار IT`} changeType={pendingReviewStores.length > 0 ? "negative" : "positive"} glowColor="emerald" />
            <StatCard icon={AlertTriangle} label="التنبيهات الأمنية" value={String(unresolvedAlerts.length)} change={criticalAlerts.length > 0 ? `${criticalAlerts.length} حرجة` : "لا توجد"} changeType={criticalAlerts.length > 0 ? "negative" : "positive"} glowColor="blue" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-arabic whitespace-nowrap transition-all ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (() => {
          const q = searchQuery.toLowerCase();
          const filteredStores = q ? stores.filter((s) => s.name.toLowerCase().includes(q) || s.id.includes(q) || s.user_id.includes(q)) : stores;
          const filteredTickets = q ? tickets.filter((t) => t.subject.toLowerCase().includes(q) || t.id.includes(q)) : [];

          return (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-gradient-to-l from-accent/5 to-card border border-accent/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-semibold text-foreground font-arabic">تعقب الإيرادات</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-arabic">الإيرادات الشهرية (MRR)</p>
                  <p className="text-2xl font-bold text-accent font-mono mt-1">{mrr.toLocaleString("ar-SA")} <span className="text-xs">ر.س</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-arabic">الإيراد السنوي المتوقع (ARR)</p>
                  <p className="text-2xl font-bold text-foreground font-mono mt-1">{(mrr * 12).toLocaleString("ar-SA")} <span className="text-xs">ر.س</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-arabic">اشتراكات نشطة</p>
                  <p className="text-2xl font-bold text-emerald font-mono mt-1">{subs.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-arabic">طلبات معلقة</p>
                  <p className="text-2xl font-bold text-primary font-mono mt-1">{pendingSubs.length}</p>
                </div>
              </div>
            </motion.div>

            {/* IT Performance & Store Lifecycle */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl bg-card border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground font-arabic">أداء الـ IT ودورة حياة المتاجر</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="rounded-lg bg-secondary/30 p-3 text-center">
                  <p className="text-lg font-bold text-muted-foreground font-mono">{draftStores.length}</p>
                  <p className="text-[10px] text-muted-foreground font-arabic">مسودة</p>
                </div>
                <div className="rounded-lg bg-accent/10 border border-accent/20 p-3 text-center">
                  <p className="text-lg font-bold text-accent font-mono">{pendingReviewStores.length}</p>
                  <p className="text-[10px] text-accent font-arabic">بانتظار IT</p>
                </div>
                <div className="rounded-lg bg-emerald/10 border border-emerald/20 p-3 text-center">
                  <p className="text-lg font-bold text-emerald font-mono">{activeStores.length}</p>
                  <p className="text-[10px] text-emerald font-arabic">نشط</p>
                </div>
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center">
                  <p className="text-lg font-bold text-destructive font-mono">{suspendedStores.length}</p>
                  <p className="text-[10px] text-destructive font-arabic">معلّق</p>
                </div>
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
                  <p className="text-lg font-bold text-primary font-mono">{approvedToday}</p>
                  <p className="text-[10px] text-primary font-arabic">فعّلها IT اليوم</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <span className="text-xs text-muted-foreground font-arabic">تذاكر معلقة: <span className="text-foreground font-bold">{pendingTickets}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-muted-foreground font-arabic">تنبيهات حرجة: <span className="text-foreground font-bold">{criticalAlerts.length}</span></span>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-xl bg-card border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 font-arabic">المتاجر المسجلة {q && `(${filteredStores.length})`}</h3>
                {loading ? <TableSkeleton rows={5} /> : (
                  <div className="space-y-2">
                    {filteredStores.slice(0, 15).map((store) => (
                      <div key={store.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                        <div>
                          <span className="text-sm font-semibold text-foreground font-arabic">{store.name}</span>
                          <p className="text-[10px] text-muted-foreground font-mono">{store.id.slice(0, 8)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${
                            store.store_status === "active" ? "text-emerald border-emerald/30" :
                            store.store_status === "pending_review" ? "text-accent border-accent/30" :
                            store.store_status === "suspended" ? "text-destructive border-destructive/30" :
                            "text-muted-foreground border-border"
                          }`}>
                            {store.store_status === "active" ? "نشط" : store.store_status === "pending_review" ? "بانتظار IT" : store.store_status === "suspended" ? "معلّق" : "مسودة"}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${store.hardware_choice ? "text-emerald border-emerald/30" : "text-accent border-accent/30"}`}>
                            {store.hardware_choice || "بدون جهاز"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {filteredStores.length === 0 && <p className="text-center text-sm text-muted-foreground py-8 font-arabic">{q ? "لا توجد نتائج" : "لا توجد متاجر مسجلة بعد"}</p>}
                  </div>
                )}
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

            {q && filteredTickets.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 font-arabic">نتائج البحث — التذاكر ({filteredTickets.length})</h3>
                <div className="space-y-2">
                  {filteredTickets.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border cursor-pointer hover:border-primary/30" onClick={() => setSelectedTicket(t)}>
                      <div>
                        <span className="text-sm font-semibold text-foreground font-arabic">{t.subject}</span>
                        <p className="text-[10px] text-muted-foreground font-mono">{t.id.slice(0, 8)}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
          );
        })()}

        {/* Surveillance Tab */}
        {activeTab === "surveillance" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground font-arabic">عين الإدارة — آخر التدقيقات لحظياً</h3>
              <span className="text-[10px] text-emerald font-mono animate-pulse">● LIVE</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveAudits.slice(0, 12).map((audit) => {
                const isFail = audit.status === "fail";
                return (
                  <motion.div
                    key={audit.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl bg-card border p-4 transition-all ${
                      isFail ? "border-destructive/50 glow-red-pulse" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-foreground font-arabic">{storeNameMap[audit.store_id] || audit.store_id.slice(0, 8)}</span>
                      <Badge variant="outline" className={`text-[10px] ${
                        audit.status === "pass" ? "text-emerald border-emerald/30" : audit.status === "warning" ? "text-accent border-accent/30" : "text-destructive border-destructive/30"
                      }`}>
                        {audit.status === "pass" ? "ناجح" : audit.status === "warning" ? "تحذير" : "فشل"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold font-mono ${
                        (audit.score || 0) >= 80 ? "text-emerald" : (audit.score || 0) >= 50 ? "text-accent" : "text-destructive"
                      }`}>
                        {audit.score !== null ? `${audit.score}%` : "—"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        <Clock className="w-3 h-3 inline me-1" />
                        {new Date(audit.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {audit.summary && <p className="text-[10px] text-muted-foreground mt-1 font-arabic truncate">{audit.summary}</p>}
                  </motion.div>
                );
              })}
            </div>
            {liveAudits.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm font-arabic">
                <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
                بانتظار بيانات التدقيق من المتاجر...
              </div>
            )}
          </motion.div>
        )}

        {/* Engines Tab */}
        {activeTab === "engines" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground font-arabic">مراقبة المحركات — Heartbeat & API Keys</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-card border border-border p-4 text-center">
                <Wifi className="w-5 h-5 text-emerald mx-auto mb-1" />
                <p className="text-lg font-bold text-emerald font-mono">{stores.filter(s => getEngineStatus(s.id) === "online").length}</p>
                <p className="text-[10px] text-muted-foreground font-arabic">متصل</p>
              </div>
              <div className="rounded-xl bg-card border border-border p-4 text-center">
                <AlertTriangle className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="text-lg font-bold text-accent font-mono">{stores.filter(s => getEngineStatus(s.id) === "warning").length}</p>
                <p className="text-[10px] text-muted-foreground font-arabic">تحذير</p>
              </div>
              <div className="rounded-xl bg-card border border-border p-4 text-center">
                <WifiOff className="w-5 h-5 text-destructive mx-auto mb-1" />
                <p className="text-lg font-bold text-destructive font-mono">{stores.filter(s => getEngineStatus(s.id) === "offline").length}</p>
                <p className="text-[10px] text-muted-foreground font-arabic">غير متصل</p>
              </div>
            </div>
            <div className="space-y-2">
              {stores.map((store) => {
                const status = getEngineStatus(store.id);
                const lastAudit = storeLastAudit[store.id];
                const hasKey = !!apiKeys[store.id];
                return (
                  <motion.div key={store.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl bg-card border p-4 ${
                      status === "online" ? "border-emerald/30" : status === "warning" ? "border-accent/30" : "border-destructive/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          status === "online" ? "bg-emerald animate-pulse" : status === "warning" ? "bg-accent" : "bg-destructive"
                        }`} />
                        <div>
                          <p className="text-sm font-bold text-foreground font-arabic">{store.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {lastAudit ? `آخر نبضة: ${new Date(lastAudit).toLocaleString("ar-SA")}` : "لم يتصل بعد"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasKey ? (
                          <div className="flex items-center gap-1">
                            <code className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded font-mono">
                              {apiKeys[store.id].api_key.slice(0, 8)}...
                            </code>
                            <Button size="sm" variant="ghost" onClick={() => copyApiKey(apiKeys[store.id].api_key)} className="h-7 w-7 p-0">
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleGenerateApiKey(store.id)} className="text-xs font-arabic h-7 gap-1">
                            <Key className="w-3 h-3" /> إنشاء مفتاح
                          </Button>
                        )}
                        <Badge variant="outline" className={`text-[10px] ${
                          status === "online" ? "text-emerald border-emerald/30" : status === "warning" ? "text-accent border-accent/30" : "text-destructive border-destructive/30"
                        }`}>
                          {status === "online" ? "متصل" : status === "warning" ? "بطيء" : "غير متصل"}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {stores.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm font-arabic">
                <Cpu className="w-10 h-10 mx-auto mb-3 opacity-20" />
                لا توجد متاجر مسجلة بعد
              </div>
            )}
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && <UserManagement />}

        {/* Approvals Tab */}
        {activeTab === "approvals" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-foreground font-arabic">طلبات الاشتراك المعلقة</h3>
            </div>
            {pendingSubs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm font-arabic">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                لا توجد طلبات معلقة — جميع الاشتراكات مفعّلة
              </div>
            ) : (
              pendingSubs.map((sub) => (
                <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card border border-accent/20 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <UserPlus className="w-4 h-4 text-accent" />
                        <span className="text-sm font-bold text-foreground font-arabic">طلب اشتراك جديد</span>
                        <Badge variant="outline" className="text-[10px] text-accent border-accent/30">{tierNameAr(sub.tier)}</Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="font-mono">User ID: {sub.user_id.slice(0, 12)}...</p>
                        <p className="font-arabic">السعر: <span className="text-foreground font-bold">{sub.price_sar} ر.س/شهرياً</span></p>
                        <p className="font-mono text-[10px]">{new Date(sub.created_at).toLocaleString("ar-SA")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSubscriptionApproval(sub.id, sub.user_id, true)} className="bg-emerald/10 text-emerald hover:bg-emerald/20 border border-emerald/30 font-arabic text-xs">
                        <CheckCircle className="w-3 h-3 me-1" /> تفعيل
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSubscriptionApproval(sub.id, sub.user_id, false)} className="text-destructive border-destructive/30 hover:bg-destructive/10 font-arabic text-xs">
                        <XCircle className="w-3 h-3 me-1" /> رفض
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Queries Tab */}
        {activeTab === "queries" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="text-sm text-muted-foreground font-arabic">مراجعة والموافقة على استعلامات التدقيق المخصصة — فقط المعتمدة تظهر في الـ remote-config</p>
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

        {/* Broadcast Tab */}
        {activeTab === "broadcast" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-foreground font-arabic">مركز البث — إرسال إعلان لجميع المستخدمين</h3>
            </div>
            <div className="rounded-xl bg-card border border-border p-6 space-y-4">
              <Textarea
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="اكتب رسالة الإعلان هنا... (مثال: سيتم إيقاف النظام للصيانة يوم الخميس)"
                className="min-h-[100px] font-arabic"
              />
              <div className="flex items-center gap-4">
                <label className="text-xs text-muted-foreground font-arabic">إرسال إلى:</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground font-arabic"
                >
                  <option value="all">جميع المستخدمين</option>
                  <option value="merchant">التجار فقط</option>
                  <option value="it_support">فريق IT فقط</option>
                </select>
                <div className="flex-1" />
                <Button onClick={handleSendBroadcast} disabled={sendingBroadcast || !broadcastMsg.trim()} className="font-arabic gap-2">
                  <Send className="w-4 h-4" /> {sendingBroadcast ? "جاري الإرسال..." : "بث الإعلان"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Alerts Tab */}
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
                    <span className="text-xs text-muted-foreground font-mono">{new Date(alert.created_at).toLocaleString("ar-SA")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-arabic">{alert.message}</p>
                  {alert.store_id && <span className="text-[10px] text-muted-foreground/60 font-arabic">المتجر: {storeNameMap[alert.store_id] || alert.store_id.slice(0, 8)}</span>}
                </div>
                {(alert.alert_type === "critical" || alert.alert_type === "tampering") && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-destructive animate-pulse">حرج</span>
                )}
              </div>
            ))}
            {alerts.length === 0 && <p className="text-center text-sm text-muted-foreground py-8 font-arabic">لا توجد تنبيهات أمنية</p>}
          </motion.div>
        )}

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl bg-card border border-border p-5 cursor-pointer hover:border-primary/30 transition-all" onClick={() => setSelectedTicket(ticket)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-bold text-foreground font-arabic">{ticket.subject}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground font-arabic line-clamp-2">{ticket.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">{new Date(ticket.created_at).toLocaleString("ar-SA")}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant="outline" className={`text-[10px] ${
                      ticket.priority === "high" ? "text-destructive border-destructive/30" : ticket.priority === "medium" ? "text-accent border-accent/30" : "text-emerald border-emerald/30"
                    }`}>
                      {ticket.priority === "high" ? "عالية" : ticket.priority === "medium" ? "متوسطة" : "منخفضة"}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${
                      ticket.status === "resolved" || ticket.status === "closed" ? "text-emerald border-emerald/30" : ticket.status === "in_progress" ? "text-accent border-accent/30" : "text-primary border-primary/30"
                    }`}>
                      {ticket.status === "resolved" ? "تم الحل" : ticket.status === "in_progress" ? "قيد المعالجة" : ticket.status === "closed" ? "مغلقة" : "مفتوحة"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-center text-sm text-muted-foreground py-8 font-arabic">لا توجد تذاكر دعم</p>}
          </motion.div>
        )}

        {/* Ticket Chat Modal */}
        {selectedTicket && (
          <TicketChat
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onStatusChange={handleTicketStatus}
            senderRole="super_owner"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
