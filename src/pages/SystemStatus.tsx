import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Wifi, WifiOff, Clock, Server, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { StatCardSkeleton } from "@/components/ui/carbon-skeleton";

interface StoreHealth {
  id: string;
  name: string;
  is_active: boolean | null;
  hardware_choice: string | null;
  last_audit_at: string | null;
  status: "online" | "offline" | "inactive";
  minutesAgo: number | null;
}

const OFFLINE_THRESHOLD_MINUTES = 7; // interval(5) + 2

export default function SystemStatus() {
  const [stores, setStores] = useState<StoreHealth[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    const { data: storesData } = await supabase
      .from("stores")
      .select("id, name, is_active, hardware_choice")
      .order("name");

    if (!storesData) { setLoading(false); return; }

    const healthData: StoreHealth[] = [];

    for (const store of storesData) {
      const { data: lastLog } = await supabase
        .from("analytics_logs")
        .select("created_at")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastAt = lastLog?.[0]?.created_at || null;
      let minutesAgo: number | null = null;
      let status: "online" | "offline" | "inactive" = "inactive";

      if (!store.is_active) {
        status = "inactive";
      } else if (lastAt) {
        minutesAgo = Math.round((Date.now() - new Date(lastAt).getTime()) / 60000);
        status = minutesAgo <= OFFLINE_THRESHOLD_MINUTES ? "online" : "offline";
      } else {
        status = "offline";
      }

      healthData.push({
        id: store.id,
        name: store.name,
        is_active: store.is_active,
        hardware_choice: store.hardware_choice,
        last_audit_at: lastAt,
        status,
        minutesAgo,
      });
    }

    setStores(healthData);
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const online = stores.filter((s) => s.status === "online").length;
  const offline = stores.filter((s) => s.status === "offline").length;
  const inactive = stores.filter((s) => s.status === "inactive").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-arabic">حالة النظام</h1>
            <p className="text-sm text-muted-foreground mt-1 font-arabic">مراقبة اتصال المتاجر والأجهزة</p>
          </div>
          <Button variant="outline" onClick={fetchHealth} size="sm" className="font-arabic">
            <RefreshCw className="w-4 h-4 me-2" /> تحديث
          </Button>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <Wifi className="w-5 h-5 text-emerald mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald font-mono">{online}</p>
            <p className="text-xs text-muted-foreground font-arabic">متصل</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <WifiOff className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-bold text-destructive font-mono">{offline}</p>
            <p className="text-xs text-muted-foreground font-arabic">غير متصل</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <Server className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold text-muted-foreground font-mono">{inactive}</p>
            <p className="text-xs text-muted-foreground font-arabic">متوقف</p>
          </div>
        </div>

        {/* Store Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((store) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl bg-card border p-5 transition-all ${
                  store.status === "offline" ? "border-destructive/40 shadow-[0_0_20px_-5px_hsl(0,84%,60%,0.3)]" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      store.status === "online" ? "bg-emerald animate-pulse" : store.status === "offline" ? "bg-destructive animate-pulse" : "bg-muted-foreground"
                    }`} />
                    <h4 className="text-sm font-bold text-foreground font-arabic">{store.name}</h4>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-mono uppercase tracking-widest ${
                    store.status === "online" ? "text-emerald border-emerald/30" : store.status === "offline" ? "text-destructive border-destructive/30" : "text-muted-foreground border-border"
                  }`}>
                    {store.status === "online" ? "ONLINE" : store.status === "offline" ? "OFFLINE" : "INACTIVE"}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="font-arabic">الجهاز</span>
                    <span className="font-mono">{store.hardware_choice || "—"}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="font-arabic">آخر تدقيق</span>
                    <span className="font-mono">
                      {store.minutesAgo !== null
                        ? store.minutesAgo < 1 ? "الآن" : `منذ ${store.minutesAgo} دقيقة`
                        : "لا يوجد"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
