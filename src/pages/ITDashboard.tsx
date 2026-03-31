import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Server, Activity, Wifi, WifiOff, Clock, Eye, Store, AlertTriangle, MessageSquare, RefreshCw, Pause, Play, Bug, Zap, Upload } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/carbon-skeleton";
import TicketChat from "@/components/tickets/TicketChat";

interface StoreHealth {
  id: string;
  name: string;
  is_active: boolean | null;
  hardware_choice: string | null;
  rtsp_url: string | null;
  remote_command: string;
  debug_mode: boolean;
  last_audit_at: string | null;
  last_score: number | null;
  status: "online" | "warning" | "offline";
}

interface AuditLog {
  id: string;
  store_id: string;
  score: number | null;
  status: string | null;
  summary: string | null;
  disputed: boolean | null;
  ai_reasoning: string | null;
  confidence_score: number | null;
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

interface SyncStatus {
  store_id: string;
  total: number;
  synced: number;
}

export default function ITDashboard() {
  useAuth();
  const [storeHealths, setStoreHealths] = useState<StoreHealth[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"heartbeat" | "logs" | "tickets" | "debug">("heartbeat");
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("it-audit-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_logs" }, (payload) => {
        setRecentLogs((prev) => [payload.new as AuditLog, ...prev].slice(0, 50));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_tickets" }, () => {
        toast.info("🎫 تذكرة دعم جديدة!", { description: "تحقق من تبويب التذاكر" });
        fetchData();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "system_logs" }, (payload) => {
        setDebugLogs((prev) => [payload.new, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const [storesRes, logsRes, ticketsRes, debugRes] = await Promise.all([
      supabase.from("stores").select("id, name, is_active, hardware_choice, rtsp_url, remote_command, debug_mode"),
      supabase.from("analytics_logs").select("id, store_id, score, status, summary, disputed, ai_reasoning, confidence_score, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    const stores = storesRes.data || [];
    const logs = logsRes.data || [];
    const names: Record<string, string> = {};
    stores.forEach((s: any) => { names[s.id] = s.name; });
    setStoreNames(names);
    setRecentLogs(logs as AuditLog[]);
    if (ticketsRes.data) setTickets(ticketsRes.data as TicketRow[]);
    if (debugRes.data) setDebugLogs(debugRes.data);

    const now = Date.now();
    const healthList: StoreHealth[] = stores.map((s: any) => {
      const storeLogs = logs.filter((l: any) => l.store_id === s.id);
      const lastLog = storeLogs[0];
      const lastAt = lastLog?.created_at || null;
      const minutesAgo = lastAt ? (now - new Date(lastAt).getTime()) / 60000 : Infinity;
      let status: "online" | "warning" | "offline" = "online";
      if (minutesAgo > 15) status = "offline";
      else if (minutesAgo > 7) status = "warning";
      return {
        id: s.id,
        name: s.name,
        is_active: s.is_active,
        hardware_choice: s.hardware_choice,
        rtsp_url: s.rtsp_url,
        remote_command: s.remote_command || "run",
        debug_mode: s.debug_mode ?? false,
        last_audit_at: lastAt,
        last_score: lastLog?.score ?? null,
        status,
      };
    });
    setStoreHealths(healthList);
    setLoading(false);
  };

  const sendCommand = async (storeId: string, command: string) => {
    const { error } = await supabase.from("stores").update({ remote_command: command } as any).eq("id", storeId);
    if (error) { toast.error("خطأ في إرسال الأمر"); return; }
    toast.success(`تم إرسال الأمر: ${command}`);
    setStoreHealths((prev) => prev.map((s) => s.id === storeId ? { ...s, remote_command: command } : s));
  };

  const toggleDebugMode = async (storeId: string, current: boolean) => {
    const { error } = await supabase.from("stores").update({ debug_mode: !current } as any).eq("id", storeId);
    if (error) { toast.error("خطأ في تغيير وضع التصحيح"); return; }
    toast.success(!current ? "🐛 تم تفعيل وضع التصحيح" : "وضع التصحيح معطّل");
    setStoreHealths((prev) => prev.map((s) => s.id === storeId ? { ...s, debug_mode: !current } : s));
  };

  const handleTicketStatus = async (ticketId: string, status: string) => {
    await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
    toast.success("تم تحديث حالة التذكرة");
    setSelectedTicket(null);
    fetchData();
  };

  const onlineCount = storeHealths.filter((s) => s.status === "online").length;
  const warningCount = storeHealths.filter((s) => s.status === "warning").length;
  const offlineCount = storeHealths.filter((s) => s.status === "offline").length;
  const disputedCount = recentLogs.filter((l) => l.disputed).length;
  const avgScore = recentLogs.length
    ? Math.round(recentLogs.filter((l) => l.score !== null).reduce((a, l) => a + (l.score || 0), 0) / recentLogs.filter((l) => l.score !== null).length)
    : 0;
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  const statusIcon = (s: string) => {
    if (s === "online") return <Wifi className="w-4 h-4 text-emerald-400" />;
    if (s === "warning") return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />;
    return <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />;
  };

  const timeSince = (dt: string | null) => {
    if (!dt) return "لا يوجد";
    const mins = Math.round((Date.now() - new Date(dt).getTime()) / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `${mins} دقيقة`;
    return `${Math.round(mins / 60)} ساعة`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={6} />
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: "heartbeat" as const, label: "نبضات المحركات", icon: Activity },
    { id: "logs" as const, label: `السجلات ${disputedCount > 0 ? `(${disputedCount} طعن)` : ""}`, icon: Eye },
    { id: "tickets" as const, label: `التذاكر (${openTickets})`, icon: MessageSquare },
    { id: "debug" as const, label: `التصحيح (${debugLogs.length})`, icon: Bug },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-blue">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground font-arabic">مركز القيادة التقني</h1>
            <p className="text-xs text-muted-foreground font-arabic">مراقبة المحركات · التحكم عن بُعد · خطط الطوارئ</p>
          </div>
        </div>

        {/* Offline Alert Banner */}
        {offlineCount > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-destructive animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-bold text-destructive font-arabic">⚠️ {offlineCount} محرك منقطع منذ أكثر من 15 دقيقة</p>
              <p className="text-xs text-destructive/80 font-arabic">تحقق من اتصال الإنترنت والكاميرات في الفروع المعنية</p>
            </div>
          </motion.div>
        )}

        {/* Sync Progress Banners */}
        {syncStatuses.map((sync) => (
          <motion.div key={sync.store_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-primary/10 border border-primary/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-4 h-4 text-primary animate-pulse" />
              <p className="text-sm font-bold text-primary font-arabic">
                مزامنة بيانات متأخرة لفرع [{storeNames[sync.store_id] || sync.store_id.slice(0, 8)}]... {sync.synced}/{sync.total}
              </p>
            </div>
            <Progress value={(sync.synced / sync.total) * 100} className="h-2" />
          </motion.div>
        ))}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Store} label="إجمالي المتاجر" value={String(storeHealths.length)} />
          <StatCard icon={Wifi} label="متصل" value={String(onlineCount)} glowColor="emerald" />
          <StatCard icon={AlertTriangle} label="تحذير / منقطع" value={`${warningCount} / ${offlineCount}`} />
          <StatCard icon={Activity} label="متوسط النقاط" value={`${avgScore}%`} />
          <StatCard icon={MessageSquare} label="تذاكر مفتوحة" value={String(openTickets)} glowColor="blue" />
        </div>

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

        {/* Heartbeat Tab */}
        {activeTab === "heartbeat" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground font-arabic">نبضات المتاجر + التحكم عن بُعد + الطوارئ</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {storeHealths.map((store) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass rounded-xl p-4 border ${
                    store.status === "offline" ? "border-red-500/30 red-pulse" : store.status === "warning" ? "border-yellow-500/30" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground font-arabic">{store.name}</span>
                    <div className="flex items-center gap-2">
                      {store.debug_mode && (
                        <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-400/30 animate-pulse">
                          <Bug className="w-3 h-3 me-1" /> DEBUG
                        </Badge>
                      )}
                      {statusIcon(store.status)}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
                    <div className="flex justify-between">
                      <span className="font-arabic">آخر نبضة:</span>
                      <span className="font-mono">{timeSince(store.last_audit_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-arabic">آخر نتيجة:</span>
                      <span className={`font-mono font-bold ${(store.last_score ?? 0) >= 80 ? "text-emerald-400" : (store.last_score ?? 0) >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                        {store.last_score !== null ? `${store.last_score}%` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-arabic">الجهاز:</span>
                      <span className="font-mono">{store.hardware_choice || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-arabic">RTSP:</span>
                      <Badge variant={store.rtsp_url ? "default" : "destructive"} className="text-[10px] h-4">
                        {store.rtsp_url ? "مُعد" : "غير مُعد"}
                      </Badge>
                    </div>
                  </div>

                  {/* Remote Commands + Emergency */}
                  <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                    <Button size="sm" variant="outline" onClick={() => sendCommand(store.id, "restart")}
                      className="flex-1 h-7 text-[10px] font-arabic gap-1 text-accent border-accent/30 hover:bg-accent/10">
                      <RefreshCw className="w-3 h-3" /> Reset Stream
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => sendCommand(store.id, store.remote_command === "shutdown" ? "run" : "shutdown")}
                      className={`flex-1 h-7 text-[10px] font-arabic gap-1 ${
                        store.remote_command === "shutdown" ? "text-emerald border-emerald/30 hover:bg-emerald/10" : "text-destructive border-destructive/30 hover:bg-destructive/10"
                      }`}>
                      {store.remote_command === "shutdown" ? <><Play className="w-3 h-3" /> تشغيل</> : <><Pause className="w-3 h-3" /> إيقاف</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => sendCommand(store.id, "update_config")}
                      className="flex-1 h-7 text-[10px] font-arabic gap-1 text-primary border-primary/30 hover:bg-primary/10">
                      <Zap className="w-3 h-3" /> تحديث إعدادات
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleDebugMode(store.id, store.debug_mode)}
                      className={`flex-1 h-7 text-[10px] font-arabic gap-1 ${
                        store.debug_mode ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" : "text-muted-foreground border-border hover:bg-secondary"
                      }`}>
                      <Bug className="w-3 h-3" /> {store.debug_mode ? "إلغاء Debug" : "Debug Mode"}
                    </Button>
                  </div>
                </motion.div>
              ))}
              {storeHealths.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8 font-arabic">لا توجد متاجر مسجلة بعد</p>
              )}
            </div>
          </div>
        )}

        {/* Logs Tab - with dispute indicators */}
        {activeTab === "logs" && (
          <div className="glass-strong rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-accent" />
              <h2 className="text-base font-semibold text-foreground font-arabic">آخر عمليات التدقيق</h2>
              {disputedCount > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  {disputedCount} طعن معلّق
                </Badge>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-right py-2 px-3 font-arabic">المتجر</th>
                    <th className="text-right py-2 px-3 font-arabic">النتيجة</th>
                    <th className="text-right py-2 px-3 font-arabic">الثقة</th>
                    <th className="text-right py-2 px-3 font-arabic">الحالة</th>
                    <th className="text-right py-2 px-3 font-arabic">الملخص</th>
                    <th className="text-right py-2 px-3 font-arabic">التوقيت</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.slice(0, 20).map((log) => (
                    <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`border-b border-border/50 hover:bg-secondary/50 transition-colors ${log.disputed ? "bg-destructive/5" : ""}`}>
                      <td className="py-2 px-3 font-arabic">
                        {storeNames[log.store_id] || log.store_id.slice(0, 8)}
                        {log.disputed && (
                          <Badge variant="destructive" className="text-[8px] ms-1">طعن</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`font-mono font-bold ${(log.score ?? 0) >= 80 ? "text-emerald-400" : (log.score ?? 0) >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                          {log.score !== null ? `${log.score}%` : "—"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.confidence_score !== null ? `${log.confidence_score}%` : "—"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={log.status === "pass" ? "default" : "destructive"} className="text-[10px]">
                          {log.status === "pass" ? "ناجح" : "فشل"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground max-w-[200px] truncate font-arabic">
                        {log.ai_reasoning || log.summary || "—"}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{timeSince(log.created_at)}</td>
                    </motion.tr>
                  ))}
                  {recentLogs.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground font-arabic">لا توجد سجلات تدقيق</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground font-arabic">تذاكر الدعم الفني</h2>
            </div>
            {tickets.map((ticket) => (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTicket(ticket)}
                className="rounded-xl bg-card border border-border p-4 cursor-pointer hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <h4 className="text-sm font-bold text-foreground font-arabic">{ticket.subject}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground font-arabic line-clamp-1">{ticket.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">{new Date(ticket.created_at).toLocaleString("ar-SA")}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    <Badge variant="outline" className={`text-[10px] ${
                      ticket.priority === "high" ? "text-destructive border-destructive/30" : ticket.priority === "medium" ? "text-accent border-accent/30" : "text-emerald border-emerald/30"
                    }`}>
                      {ticket.priority === "high" ? "عالية" : ticket.priority === "medium" ? "متوسطة" : "منخفضة"}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${
                      ticket.status === "resolved" || ticket.status === "closed" ? "text-emerald border-emerald/30" : "text-primary border-primary/30"
                    }`}>
                      {ticket.status === "resolved" ? "تم الحل" : ticket.status === "in_progress" ? "قيد المعالجة" : "مفتوحة"}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
            {tickets.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8 font-arabic">لا توجد تذاكر</p>
            )}
          </div>
        )}

        {/* Debug Mode Tab */}
        {activeTab === "debug" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="w-5 h-5 text-yellow-400" />
              <h2 className="text-base font-semibold text-foreground font-arabic">سجلات التصحيح — Raw AI Responses</h2>
            </div>
            <p className="text-xs text-muted-foreground font-arabic">فعّل وضع التصحيح لأي متجر من تبويب "نبضات المحركات" لتظهر هنا استجابات الـ AI الخام</p>
            {debugLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm font-arabic">
                <Bug className="w-10 h-10 mx-auto mb-3 opacity-20" />
                لا توجد سجلات تصحيح — فعّل Debug Mode لأحد المتاجر
              </div>
            ) : (
              debugLogs.map((log: any) => (
                <motion.div key={log.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-card border border-yellow-500/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bug className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs font-bold text-foreground font-arabic">{storeNames[log.store_id] || log.store_id?.slice(0, 8)}</span>
                      <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-400/30">{log.log_type}</Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{timeSince(log.created_at)}</span>
                  </div>
                  <pre className="text-[11px] text-muted-foreground bg-secondary/50 rounded-lg p-3 overflow-x-auto max-h-48 font-mono leading-relaxed">
                    {JSON.stringify(log.raw_response, null, 2)}
                  </pre>
                  {log.metadata && (
                    <div className="mt-2 text-[10px] text-muted-foreground/70 font-mono">
                      Metadata: {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Ticket Chat Modal */}
        {selectedTicket && (
          <TicketChat
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onStatusChange={handleTicketStatus}
            senderRole="it_support"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
