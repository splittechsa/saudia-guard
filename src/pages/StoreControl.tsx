import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sliders, Store } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MerchantControlPanel } from "@/components/dashboard/MerchantControlPanel";
import { CustomQuestionsEditor } from "@/components/dashboard/CustomQuestionsEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCardSkeleton } from "@/components/ui/carbon-skeleton";

interface StoreData {
  id: string;
  name: string;
  is_active: boolean | null;
  operating_hours: any;
  whatsapp_enabled: boolean | null;
  custom_queries: any;
  query_status: string;
}

export default function StoreControl() {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    const [stRes, subRes] = await Promise.all([
      supabase.from("stores").select("id, name, is_active, operating_hours, whatsapp_enabled, custom_queries, query_status").eq("user_id", user.id),
      supabase.from("subscriptions").select("id, tier, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
    ]);
    if (stRes.data) setStores(stRes.data as StoreData[]);
    if (subRes.data?.[0]) setSubscription(subRes.data[0]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 rounded bg-secondary animate-pulse" />
          {[1, 2].map(i => <StatCardSkeleton key={i} />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground font-arabic flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            تحكم المتجر
          </h1>
          <p className="text-xs text-muted-foreground font-arabic mt-1">إدارة ساعات العمل والإشعارات وأسئلة التدقيق المخصصة</p>
        </div>

        {stores.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center">
            <Store className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground font-arabic">لا توجد متاجر مسجلة</p>
          </div>
        ) : (
          stores.map(store => (
            <motion.div key={store.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {stores.length > 1 && (
                <h2 className="text-sm font-bold text-foreground font-arabic flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary" />
                  {store.name}
                </h2>
              )}

              {subscription && (
                <MerchantControlPanel
                  store={{ id: store.id, name: store.name, is_active: store.is_active, operating_hours: store.operating_hours, whatsapp_enabled: store.whatsapp_enabled }}
                  subscriptionTier={subscription.tier}
                  onUpdate={loadData}
                />
              )}

              <CustomQuestionsEditor
                storeId={store.id}
                initialQueries={store.custom_queries}
                queryStatus={store.query_status || "approved"}
                isAdmin={false}
                onSave={loadData}
              />
            </motion.div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
