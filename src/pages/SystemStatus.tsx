import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Wifi, WifiOff, Clock, Server, RefreshCw, ShieldAlert, CheckCircle2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { StatCardSkeleton } from "@/components/ui/carbon-skeleton";

interface StoreHealth {
  id: string;
  name: string;
  status: "online" | "offline" | "inactive";
  hardware_choice: string | null;
  minutesAgo: number | null;
}

export default function SystemStatus() {
  const [stores, setStores] = useState<StoreHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // حساب المتغيرات من stores
  const online = stores.filter(store => store.status === "online").length;
  const offline = stores.filter(store => store.status === "offline").length;
  const inactive = stores.filter(store => store.status === "inactive").length;

  const fetchHealth = async () => {
    setLoading(true);
    try {
      // جلب المتاجر وآخر analytics_logs لكل متجر
      const [storesRes, logsRes] = await Promise.all([
        supabase.from("stores").select("id, name, hardware_choice, is_active"),
        supabase.from("analytics_logs").select("store_id, created_at").order("created_at", { ascending: false })
      ]);

      const stores = storesRes.data || [];
      const logs = logsRes.data || [];

      // تجميع آخر log لكل store
      const lastLogs: Record<string, string> = {};
      logs.forEach(log => {
        if (!lastLogs[log.store_id]) {
          lastLogs[log.store_id] = log.created_at;
        }
      });

      const now = Date.now();
      const healthList: StoreHealth[] = stores.map(store => {
        const lastLogAt = lastLogs[store.id];
        const minutesAgo = lastLogAt ? (now - new Date(lastLogAt).getTime()) / 60000 : null;
        
        let status: "online" | "offline" | "inactive";
        if (minutesAgo === null) {
          status = "inactive"; // لم يرسل أي logs أبداً
        } else if (minutesAgo > 15) {
          status = "offline";
        } else {
          status = "online";
        }

        return {
          id: store.id,
          name: store.name,
          status,
          hardware_choice: store.hardware_choice,
          minutesAgo: minutesAgo ? Math.floor(minutesAgo) : null
        };
      });

      setStores(healthList);
    } catch (error) {
      console.error("Error fetching health data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 py-4" dir="rtl">
        
        {/* Header - غرفة العمليات */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                <Activity className="w-8 h-8" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-foreground font-arabic tracking-tight">حالة الشبكة والأجهزة</h1>
                <p className="text-sm text-muted-foreground font-arabic mt-1">مراقبة حية لاتصال متاجرك بمحرك سبلت تيك</p>
             </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button variant="outline" onClick={fetchHealth} className="rounded-xl border-primary/20 hover:bg-primary/5 font-bold font-arabic group">
              <RefreshCw className={`w-4 h-4 me-2 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} /> 
              تحديث الحالة
            </Button>
            <p className="text-[10px] text-muted-foreground font-mono uppercase opacity-50">
               Last Sync: {lastRefreshed.toLocaleTimeString('en-US')}
            </p>
          </div>
        </motion.div>

        {/* ملخص الحالة العلوية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="glass-strong rounded-3xl p-6 border border-emerald/20 bg-emerald/[0.02] flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald/10 flex items-center justify-center text-emerald">
                 <Wifi className="w-8 h-8" />
              </div>
              <div>
                 <p className="text-3xl font-black text-emerald font-mono leading-none">{online}</p>
                 <p className="text-xs font-bold text-muted-foreground font-arabic mt-2 uppercase tracking-wider">متاجر متصلة</p>
              </div>
           </div>

           <div className="glass-strong rounded-3xl p-6 border border-destructive/20 bg-destructive/[0.02] flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                 <WifiOff className="w-8 h-8" />
              </div>
              <div>
                 <p className="text-3xl font-black text-destructive font-mono leading-none">{offline}</p>
                 <p className="text-xs font-bold text-muted-foreground font-arabic mt-2 uppercase tracking-wider">انقطاع اتصال</p>
              </div>
           </div>

           <div className="glass-strong rounded-3xl p-6 border border-border bg-secondary/20 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                 <Server className="w-8 h-8" />
              </div>
              <div>
                 <p className="text-3xl font-black text-muted-foreground font-mono leading-none">{inactive}</p>
                 <p className="text-xs font-bold text-muted-foreground font-arabic mt-2 uppercase tracking-wider">خارج ساعات العمل</p>
              </div>
           </div>
        </div>

        {/* Grid المتاجر التفصيلي */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {loading && stores.length === 0 ? (
             [1,2,3].map(i => <StatCardSkeleton key={i} />)
           ) : (
             stores.map((store) => (
               <motion.div
                 key={store.id}
                 layout
                 className={`group glass-strong rounded-3xl border p-6 transition-all duration-500 relative overflow-hidden ${
                   store.status === "offline" 
                   ? "border-destructive/40 shadow-lg shadow-destructive/5" 
                   : "border-border hover:border-primary/30 shadow-sm hover:shadow-xl"
                 }`}
               >
                 <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <div className={`w-3 h-3 rounded-full relative ${
                         store.status === "online" ? "bg-emerald" : store.status === "offline" ? "bg-destructive" : "bg-muted-foreground"
                       }`}>
                          {store.status !== "inactive" && (
                            <span className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                               store.status === "online" ? "bg-emerald" : "bg-destructive"
                            }`} />
                          )}
                       </div>
                       <h4 className="text-lg font-black text-foreground font-arabic tracking-tight">{store.name}</h4>
                    </div>
                    <Badge variant="outline" className={`rounded-lg px-2 py-0.5 font-black text-[9px] tracking-widest ${
                       store.status === "online" ? "bg-emerald/5 text-emerald border-emerald/20" : store.status === "offline" ? "bg-destructive/5 text-destructive border-destructive/20" : "bg-secondary text-muted-foreground"
                    }`}>
                       {store.status === "online" ? "STABLE" : store.status === "offline" ? "CRITICAL" : "IDLE"}
                    </Badge>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border/50">
                       <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-3 h-3 ${store.status === "online" ? "text-emerald" : "text-muted-foreground"}`} />
                          <span className="text-[10px] font-bold text-muted-foreground font-arabic">نوع الربط</span>
                       </div>
                       <span className="text-xs font-mono font-bold text-foreground">{store.hardware_choice || "CLOUD"}</span>
                    </div>

                    <div className="flex items-center justify-between px-2">
                       <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-primary/50" />
                          <span className="text-[10px] font-bold text-muted-foreground font-arabic">آخر مزامنة</span>
                       </div>
                       <span className={`text-[11px] font-bold font-arabic ${store.status === "offline" ? "text-destructive" : "text-foreground"}`}>
                          {store.minutesAgo !== null
                            ? store.minutesAgo < 1 ? "الآن" : `منذ ${store.minutesAgo} دقيقة`
                            : "لا يوجد سجل"}
                       </span>
                    </div>
                 </div>

                 {/* زر التدخل السريع في حال العطل */}
                 {store.status === "offline" && (
                   <Button 
                      variant="destructive" 
                      className="w-full mt-6 h-10 rounded-xl font-bold font-arabic text-xs bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
                      asChild
                   >
                      <a href="mailto:info@splittech.sa">تبليغ عن عطل فني</a>
                   </Button>
                 )}
                 
                 {/* خلفية جمالية للأوفلاين */}
                 {store.status === "offline" && (
                   <div className="absolute top-0 right-0 p-4 opacity-[0.05] text-destructive pointer-events-none">
                      <ShieldAlert className="w-16 h-16" />
                   </div>
                 )}
               </motion.div>
             ))
           )}
        </div>

        <p className="text-center text-[9px] text-muted-foreground/30 mt-12 font-mono tracking-[0.4em] uppercase">
          SplitTech Engine Watchdog · Real-Time Health Analytics · Jeddah HQ
        </p>
      </div>
    </DashboardLayout>
  );
}