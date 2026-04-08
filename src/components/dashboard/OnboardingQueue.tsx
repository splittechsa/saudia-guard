import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, CheckCircle, Clock, Store, Wifi, WifiOff, 
  AlertTriangle, Rocket, User, Activity, ArrowUpRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ... (نفس الـ Interfaces السابقة)

export function OnboardingQueue({ stores, onRefresh }: OnboardingQueueProps) {
  const { user } = useAuth();
  const [deploying, setDeploying] = useState<string | null>(null);

  // حساب جاهزية المتجر (بحد أقصى 100%)
  const calculateReadiness = (s: QueueStore) => {
    let score = 0;
    if (s.rtsp_url) score += 50; // أهم عنصر
    if (s.hardware_choice) score += 20;
    if (s.store_status === "pending_review") score += 20;
    if (s.owner_name && s.owner_name !== "غير معروف") score += 10;
    return score;
  };

  // ترتيب المتاجر: الجاهزة تماماً أولاً
  const sorted = [...stores].sort((a, b) => calculateReadiness(b) - calculateReadiness(a));

  const stats = {
    ready: sorted.filter(s => calculateReadiness(s) >= 90).length,
    pending: sorted.filter(s => calculateReadiness(s) < 90 && s.store_status === "pending_review").length,
    drafts: sorted.filter(s => s.store_status === "draft").length
  };

  const handleQuickDeploy = async (store: QueueStore) => {
    setDeploying(store.id);
    const { error } = await supabase.from("stores").update({
      store_status: "active",
      is_active: true,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      it_review_notes: "Auto-Approved: Quick Deploy activated by Admin",
    } as any).eq("id", store.id);

    if (error) {
      toast.error("فشل الإطلاق السريع");
    } else {
      toast.success(`🚀 تم إطلاق "${store.name}" بنجاح! المحرك الآن قيد التشغيل.`);
      onRefresh();
    }
    setDeploying(null);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Dashboard Stats - بأسلوب سبلت تيك */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-strong rounded-3xl p-6 border border-emerald/20 bg-emerald/[0.02] relative overflow-hidden">
          <Rocket className="w-10 h-10 text-emerald opacity-10 absolute -left-2 -bottom-2" />
          <p className="text-3xl font-black text-emerald font-mono leading-none">{stats.ready}</p>
          <p className="text-xs font-bold text-muted-foreground font-arabic mt-2 uppercase tracking-widest">جاهز للإطلاق 🚀</p>
        </div>
        <div className="glass-strong rounded-3xl p-6 border border-primary/20 bg-primary/[0.02]">
          <p className="text-3xl font-black text-primary font-mono leading-none">{stats.pending}</p>
          <p className="text-xs font-bold text-muted-foreground font-arabic mt-2 uppercase tracking-widest">بانتظار المراجعة ⏳</p>
        </div>
        <div className="glass-strong rounded-3xl p-6 border border-border">
          <p className="text-3xl font-black text-muted-foreground font-mono leading-none">{stats.drafts}</p>
          <p className="text-xs font-bold text-muted-foreground font-arabic mt-2 uppercase tracking-widest">مسودات معلقة 📁</p>
        </div>
      </div>

      {/* Queue List */}
      <div className="grid gap-4">
        <AnimatePresence>
          {sorted.length === 0 ? (
            <div className="glass-strong rounded-[2.5rem] py-20 text-center border border-dashed border-border opacity-50">
               <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
               <p className="text-sm font-bold font-arabic text-muted-foreground">قائمة الانتظار فارغة تماماً</p>
            </div>
          ) : (
            sorted.map((store) => {
              const score = calculateReadiness(store);
              const isReady = score >= 90;
              
              return (
                <motion.div
                  key={store.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`group glass-strong rounded-[2rem] border p-6 transition-all hover:shadow-xl ${
                    isReady ? "border-emerald/40 ring-1 ring-emerald/10 shadow-emerald/5" : "border-border"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Store Branding */}
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative ${
                          isReady ? "bg-emerald/10 text-emerald" : "bg-secondary text-muted-foreground"
                        }`}>
                          <Store className="w-7 h-7" />
                          {isReady && <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald rounded-full animate-ping opacity-75" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-foreground font-arabic tracking-tight">{store.name}</h4>
                            <Badge variant="outline" className={`text-[9px] font-bold ${isReady ? "text-emerald border-emerald/20" : "text-muted-foreground"}`}>
                               {isReady ? "READY" : "PENDING"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-arabic mt-1">
                             <span className="flex items-center gap-1"><User className="w-3 h-3" /> {store.owner_name}</span>
                             <span className="opacity-30">|</span>
                             <span className="font-mono">{store.owner_email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Chips */}
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-xl border border-border/50">
                           {store.rtsp_url ? <Wifi className="w-3 h-3 text-emerald" /> : <WifiOff className="w-3 h-3 text-destructive" />}
                           <span className="text-[10px] font-bold font-arabic">{store.rtsp_url ? "RTSP Valid" : "RTSP Missing"}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-xl border border-border/50">
                           <Activity className="w-3 h-3 text-primary" />
                           <span className="text-[10px] font-bold font-arabic">{store.hardware_choice || "No Hardware"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action & Progress Area */}
                    <div className="w-full md:w-64 space-y-4 md:border-r md:border-border/50 md:pr-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold font-arabic">
                           <span className="text-muted-foreground">نسبة جاهزية الإطلاق</span>
                           <span className={isReady ? "text-emerald" : "text-primary"}>{score}%</span>
                        </div>
                        <Progress value={score} className={`h-2 ${isReady ? "[&>div]:bg-emerald" : ""}`} />
                      </div>

                      {isReady ? (
                        <Button 
                          onClick={() => handleQuickDeploy(store)}
                          disabled={deploying === store.id}
                          className="w-full bg-emerald text-white hover:bg-emerald/90 rounded-xl font-black font-arabic h-11 shadow-lg shadow-emerald/20 group"
                        >
                          {deploying === store.id ? (
                            "جاري الإطلاق..."
                          ) : (
                            <>تفعيل سريع الآن <Zap className="w-4 h-4 ms-2 group-hover:scale-125 transition-transform" /></>
                          )}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full rounded-xl border-border/50 text-muted-foreground font-bold font-arabic text-xs h-11" asChild>
                           <a href={`/admin/store/${store.id}`}>مراجعة البيانات <ArrowUpRight className="w-3 h-3 ms-2" /></a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {store.it_review_notes && (
                    <div className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/10 flex gap-2 items-center">
                       <AlertTriangle className="w-3 h-3 text-destructive" />
                       <p className="text-[10px] font-bold text-destructive font-arabic">{store.it_review_notes}</p>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-[9px] text-muted-foreground/30 mt-8 font-mono tracking-[0.4em] uppercase">
        SplitTech Provisioning System · Automated Review Pipeline
      </p>
    </div>
  );
}