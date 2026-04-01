import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, CheckCircle, Clock, Store, Wifi, WifiOff, AlertTriangle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface QueueStore {
  id: string;
  name: string;
  user_id: string;
  store_status: string;
  rtsp_url: string | null;
  hardware_choice: string | null;
  it_review_notes: string | null;
  owner_name: string;
  owner_email: string;
  created_at?: string;
}

interface OnboardingQueueProps {
  stores: QueueStore[];
  onRefresh: () => void;
}

export function OnboardingQueue({ stores, onRefresh }: OnboardingQueueProps) {
  const { user } = useAuth();
  const [deploying, setDeploying] = useState<string | null>(null);

  // Sort: ready (has RTSP) first, then pending_review, then draft
  const sorted = [...stores].sort((a, b) => {
    const score = (s: QueueStore) => {
      if (s.store_status === "pending_review" && s.rtsp_url) return 0; // Ready
      if (s.store_status === "pending_review") return 1;
      return 2; // Draft
    };
    return score(a) - score(b);
  });

  const readyCount = sorted.filter(s => s.store_status === "pending_review" && s.rtsp_url).length;
  const pendingCount = sorted.filter(s => s.store_status === "pending_review" && !s.rtsp_url).length;
  const draftCount = sorted.filter(s => s.store_status === "draft").length;

  const handleQuickDeploy = async (store: QueueStore) => {
    if (!store.rtsp_url) {
      toast.error("لا يمكن التفعيل — رابط RTSP مفقود");
      return;
    }
    setDeploying(store.id);
    
    // 1. Activate store + generate API key (trigger handles key)
    const { error } = await supabase.from("stores").update({
      store_status: "active",
      is_active: true,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      it_review_notes: "تفعيل سريع — فحص آلي ناجح",
    } as any).eq("id", store.id);

    if (error) {
      toast.error("فشل التفعيل السريع");
      setDeploying(null);
      return;
    }

    // 2. Log to audit trail
    await supabase.from("audit_trail").insert({
      actor_id: user?.id || "",
      action: "quick_deploy",
      target_type: "store",
      target_id: store.id,
      metadata: { store_name: store.name, method: "quick_deploy" },
    });

    toast.success(`🚀 تم تفعيل "${store.name}" بنجاح — API Key تم توليده تلقائياً`);
    setDeploying(null);
    onRefresh();
  };

  const readinessScore = (s: QueueStore) => {
    let score = 0;
    if (s.rtsp_url) score += 40;
    if (s.hardware_choice) score += 20;
    if (s.store_status === "pending_review") score += 30;
    if (s.owner_name && s.owner_name !== "غير معروف") score += 10;
    return score;
  };

  return (
    <div className="space-y-4">
      {/* Queue Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald/5 border border-emerald/20 p-4 text-center">
          <Rocket className="w-5 h-5 text-emerald mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald font-mono">{readyCount}</p>
          <p className="text-[10px] text-muted-foreground font-arabic">جاهز للتفعيل</p>
        </div>
        <div className="rounded-xl bg-accent/5 border border-accent/20 p-4 text-center">
          <Clock className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-2xl font-bold text-accent font-mono">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground font-arabic">بانتظار البيانات</p>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
          <Store className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-2xl font-bold text-muted-foreground font-mono">{draftCount}</p>
          <p className="text-[10px] text-muted-foreground font-arabic">مسودات</p>
        </div>
      </div>

      {/* Queue List */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm font-arabic">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
          لا توجد متاجر في قائمة الانتظار
        </div>
      ) : (
        sorted.map((store) => {
          const ready = store.store_status === "pending_review" && !!store.rtsp_url;
          const score = readinessScore(store);
          return (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl bg-card border p-4 space-y-3 ${
                ready ? "border-emerald/30" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {ready ? (
                    <div className="w-3 h-3 rounded-full bg-emerald animate-pulse" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-foreground font-arabic">{store.name}</p>
                    <p className="text-[10px] text-muted-foreground font-arabic">{store.owner_name} · {store.owner_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[9px] ${ready ? "text-emerald border-emerald/30" : "text-accent border-accent/30"}`}>
                    {ready ? "جاهز للتفعيل ✓" : store.store_status === "pending_review" ? "بانتظار RTSP" : "مسودة"}
                  </Badge>
                </div>
              </div>

              {/* Readiness Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground font-arabic">جاهزية التفعيل</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{score}%</span>
                </div>
                <Progress value={score} className="h-1.5" />
              </div>

              {/* Quick info */}
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  {store.rtsp_url ? <Wifi className="w-3 h-3 text-emerald" /> : <WifiOff className="w-3 h-3 text-destructive" />}
                  {store.rtsp_url ? "RTSP مُعدّ" : "بدون RTSP"}
                </span>
                <span>{store.hardware_choice || "بدون جهاز"}</span>
              </div>

              {/* Quick Deploy */}
              {ready && (
                <Button
                  onClick={() => handleQuickDeploy(store)}
                  disabled={deploying === store.id}
                  className="w-full bg-emerald hover:bg-emerald/90 text-white font-arabic"
                  size="sm"
                >
                  <Zap className="w-4 h-4 me-2" />
                  {deploying === store.id ? "جاري التفعيل..." : "⚡ تفعيل سريع (Quick Deploy)"}
                </Button>
              )}

              {store.it_review_notes && store.store_status === "draft" && (
                <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2">
                  <p className="text-[10px] text-destructive font-arabic">
                    <AlertTriangle className="w-3 h-3 inline me-1" />
                    {store.it_review_notes}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}
