import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Server, Activity, Wifi, WifiOff, Clock, Eye, Store, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/carbon-skeleton";

interface StoreHealth {
  id: string;
  name: string;
  is_active: boolean | null;
  hardware_choice: string | null;
  rtsp_url: string | null;
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
  created_at: string;
}

export default function ITDashboard() {
  const [storeHealths, setStoreHealths] = useState<StoreHealth[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
    // Realtime logs
    const channel = supabase
      .channel("it-audit-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_logs" }, (payload) => {
        setRecentLogs((prev) => [payload.new as AuditLog, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const [storesRes, logsRes] = await Promise.all([
      supabase.from("stores").select("id, name, is_active, hardware_choice, rtsp_url"),
      supabase.from("analytics_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    const stores = storesRes.data || [];
    const logs = logsRes.data || [];
    const names: Record<string, string> = {};
    stores.forEach((s: any) => { names[s.id] = s.name; });
    setStoreNames(names);
    setRecentLogs(logs as AuditLog[]);

    // Build health map
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
        last_audit_at: lastAt,
        last_score: lastLog?.score ?? null,
        status,
      };
    });
    setStoreHealths(healthList);
    setLoading(false);
  };

  const onlineCount = storeHealths.filter((s) => s.status === "online").length;
  const warningCount = storeHealths.filter((s) => s.status === "warning").length;
  const offlineCount = storeHealths.filter((s) => s.status === "offline").length;
  const avgScore = recentLogs.length
    ? Math.round(recentLogs.filter((l) => l.score !== null).reduce((a, l) => a + (l.score || 0), 0) / recentLogs.filter((l) => l.score !== null).length)
    : 0;

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-blue">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground font-arabic">لوحة الدعم التقني</h1>
            <p className="text-xs text-muted-foreground font-arabic">مراقبة صحة الأنظمة والمتاجر</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Store} label="إجمالي المتاجر" value={storeHealths.length} />
          <StatCard icon={Wifi} label="متصل" value={onlineCount} accentColor="text-emerald-400" />
          <StatCard icon={AlertTriangle} label="تحذير / منقطع" value={`${warningCount} / ${offlineCount}`} accentColor="text-yellow-400" />
          <StatCard icon={Activity} label="متوسط النقاط" value={`${avgScore}%`} />
        </div>

        {/* Heartbeat Monitor */}
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground font-arabic">نبضات المتاجر (Heartbeat)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {storeHealths.map((store) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass rounded-xl p-4 border ${
                  store.status === "offline"
                    ? "border-red-500/30 red-pulse"
                    : store.status === "warning"
                    ? "border-yellow-500/30"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground font-arabic">{store.name}</span>
                  {statusIcon(store.status)}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
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
              </motion.div>
            ))}
            {storeHealths.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8 font-arabic">لا توجد متاجر مسجلة بعد</p>
            )}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-accent" />
            <h2 className="text-base font-semibold text-foreground font-arabic">آخر عمليات التدقيق</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-right py-2 px-3 font-arabic">المتجر</th>
                  <th className="text-right py-2 px-3 font-arabic">النتيجة</th>
                  <th className="text-right py-2 px-3 font-arabic">الحالة</th>
                  <th className="text-right py-2 px-3 font-arabic">الملخص</th>
                  <th className="text-right py-2 px-3 font-arabic">التوقيت</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.slice(0, 20).map((log) => (
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-2 px-3 font-arabic">{storeNames[log.store_id] || log.store_id.slice(0, 8)}</td>
                    <td className="py-2 px-3">
                      <span className={`font-mono font-bold ${(log.score ?? 0) >= 80 ? "text-emerald-400" : (log.score ?? 0) >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                        {log.score !== null ? `${log.score}%` : "—"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant={log.status === "pass" ? "default" : "destructive"} className="text-[10px]">
                        {log.status === "pass" ? "ناجح" : "فشل"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground max-w-[200px] truncate font-arabic">{log.summary || "—"}</td>
                    <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{timeSince(log.created_at)}</td>
                  </motion.tr>
                ))}
                {recentLogs.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground font-arabic">لا توجد سجلات تدقيق</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
