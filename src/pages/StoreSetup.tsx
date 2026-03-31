import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Wifi, Save, Eye, EyeOff, Send } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CameraGuide } from "@/components/dashboard/CameraGuide";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Store {
  id: string;
  name: string;
  rtsp_url: string | null;
  camera_username: string | null;
  camera_password: string | null;
  hardware_choice: string | null;
  is_active: boolean | null;
  store_status: string;
  it_review_notes: string | null;
  operating_hours: any;
}

export default function StoreSetup() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [rtspUrl, setRtspUrl] = useState("");
  const [camUser, setCamUser] = useState("");
  const [camPass, setCamPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("stores").select("id, name, rtsp_url, camera_username, camera_password, hardware_choice, is_active, store_status, it_review_notes, operating_hours").eq("user_id", user.id);
      if (data) {
        setStores(data as Store[]);
        if (data.length > 0) selectStore(data[0] as Store);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const selectStore = (store: Store) => {
    setSelectedStore(store);
    setRtspUrl(store.rtsp_url || "");
    setCamUser(store.camera_username || "");
    setCamPass(store.camera_password || "");
  };

  const RTSP_REGEX = /^rtsp:\/\/[\w.-]+(:\d+)?(\/\S*)?$/;

  const handleSave = async () => {
    if (!selectedStore) return;
    if (!rtspUrl.trim()) { toast.error("الرجاء إدخال رابط RTSP"); return; }
    if (!RTSP_REGEX.test(rtspUrl.trim())) { toast.error("صيغة رابط RTSP غير صحيحة"); return; }
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      rtsp_url: rtspUrl.trim(),
      camera_username: camUser.trim() || null,
      camera_password: camPass.trim() || null,
    }).eq("id", selectedStore.id);
    if (error) { toast.error("فشل حفظ الإعدادات"); }
    else {
      toast.success("تم حفظ إعدادات الكاميرا بنجاح");
      setStores((prev) => prev.map((s) => s.id === selectedStore.id ? { ...s, rtsp_url: rtspUrl, camera_username: camUser, camera_password: camPass } : s));
    }
    setSaving(false);
  };

  const handleSubmitForReview = async () => {
    if (!selectedStore) return;
    if (!selectedStore.rtsp_url && !rtspUrl.trim()) { toast.error("أدخل رابط RTSP أولاً قبل إرسال الطلب"); return; }
    // Save RTSP first if changed
    if (rtspUrl.trim() && rtspUrl !== selectedStore.rtsp_url) await handleSave();
    const { error } = await supabase.from("stores").update({ store_status: "pending_review" } as any).eq("id", selectedStore.id);
    if (error) { toast.error("فشل إرسال الطلب"); return; }
    toast.success("✅ تم إرسال الطلب للفريق التقني للمراجعة");
    setSelectedStore({ ...selectedStore, store_status: "pending_review" });
    setStores((prev) => prev.map((s) => s.id === selectedStore.id ? { ...s, store_status: "pending_review" } : s));
  };

  const storeStatusLabel = (s: string) => {
    switch (s) {
      case "draft": return { label: "مسودة — بحاجة لإعداد", color: "text-muted-foreground border-border" };
      case "pending_review": return { label: "بانتظار التحقق التقني", color: "text-accent border-accent/30" };
      case "active": return { label: "نشط — يتم التدقيق", color: "text-emerald border-emerald/30" };
      case "suspended": return { label: "معلّق", color: "text-destructive border-destructive/30" };
      default: return { label: s, color: "text-muted-foreground border-border" };
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-foreground font-arabic">إعداد المتجر والكاميرا</h1>
          <p className="text-sm text-muted-foreground mt-1 font-arabic">ربط الكاميرا وإرسال الطلب للفريق التقني</p>
        </motion.div>

        {stores.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-12 text-center">
            <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold text-foreground mb-2 font-arabic">لا توجد متاجر</h3>
            <p className="text-sm text-muted-foreground font-arabic">أنشئ متجراً من صفحة الإعداد الأولي أولاً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Store List */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-arabic mb-3">المتاجر</h3>
              {stores.map((store) => {
                const st = storeStatusLabel(store.store_status);
                return (
                  <button
                    key={store.id}
                    onClick={() => selectStore(store)}
                    className={`w-full text-right p-4 rounded-xl border transition-all ${
                      selectedStore?.id === store.id ? "bg-primary/10 border-primary" : "bg-card border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[9px] ${st.color}`}>{st.label}</Badge>
                      <div className="flex-1 me-3">
                        <p className="text-sm font-semibold text-foreground font-arabic">{store.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{store.hardware_choice || "بدون جهاز"}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Camera Setup */}
            {selectedStore && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-4">
                {/* Status Bar */}
                <div className="flex items-center justify-between rounded-xl bg-card border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedStore.store_status === "active" ? "bg-emerald animate-pulse" : selectedStore.store_status === "pending_review" ? "bg-accent animate-pulse" : "bg-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-semibold text-foreground font-arabic">{selectedStore.name}</p>
                      <Badge variant="outline" className={`text-[10px] mt-1 ${storeStatusLabel(selectedStore.store_status).color}`}>
                        {storeStatusLabel(selectedStore.store_status).label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* IT Review Notes (if rejected) */}
                {selectedStore.it_review_notes && selectedStore.store_status === "draft" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
                    <p className="text-xs font-bold text-destructive font-arabic mb-1">ملاحظة من الفريق التقني:</p>
                    <p className="text-sm text-foreground font-arabic">{selectedStore.it_review_notes}</p>
                  </motion.div>
                )}

                {/* RTSP Config */}
                <div className="rounded-xl bg-card border border-border p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground font-arabic">إعدادات الكاميرا (RTSP)</h3>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-arabic">رابط RTSP</label>
                    <Input
                      value={rtspUrl}
                      onChange={(e) => setRtspUrl(e.target.value)}
                      placeholder="rtsp://192.168.1.100:554/stream1"
                      className="bg-secondary border-border text-foreground text-sm font-mono placeholder:text-muted-foreground"
                      dir="ltr"
                      disabled={selectedStore.store_status === "active"}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 font-arabic">مثال: rtsp://IP:PORT/stream — تحقق من دليل الكاميرا</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-arabic">اسم المستخدم</label>
                      <Input
                        value={camUser}
                        onChange={(e) => setCamUser(e.target.value)}
                        placeholder="admin"
                        className="bg-secondary border-border text-foreground text-sm font-mono placeholder:text-muted-foreground"
                        dir="ltr"
                        disabled={selectedStore.store_status === "active"}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-arabic">كلمة المرور</label>
                      <div className="relative">
                        <Input
                          type={showPass ? "text" : "password"}
                          value={camPass}
                          onChange={(e) => setCamPass(e.target.value)}
                          placeholder="••••••"
                          className="bg-secondary border-border text-foreground text-sm font-mono placeholder:text-muted-foreground pe-10"
                          dir="ltr"
                          disabled={selectedStore.store_status === "active"}
                        />
                        <button onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    {selectedStore.store_status !== "active" && (
                      <>
                        <Button variant="outline" onClick={handleSave} disabled={saving} className="font-arabic">
                          <Save className="w-4 h-4 me-2" /> {saving ? "جاري الحفظ..." : "حفظ مسودة"}
                        </Button>
                        {selectedStore.store_status === "draft" && (
                          <Button onClick={handleSubmitForReview} className="bg-primary text-primary-foreground hover:bg-primary/90 font-arabic">
                            <Send className="w-4 h-4 me-2" /> إرسال للتحقق التقني
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Lifecycle Steps */}
                <div className="rounded-xl bg-card border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 font-arabic">مراحل التفعيل</h3>
                  <div className="space-y-3">
                    {[
                      { step: 1, label: "إدخال بيانات الكاميرا", done: !!selectedStore.rtsp_url },
                      { step: 2, label: "إرسال للتحقق التقني", done: selectedStore.store_status !== "draft" },
                      { step: 3, label: "اعتماد من الفريق التقني", done: selectedStore.store_status === "active" },
                      { step: 4, label: "بدء التدقيق الآلي", done: selectedStore.store_status === "active" && selectedStore.is_active },
                    ].map((s) => (
                      <div key={s.step} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          s.done ? "bg-emerald text-white" : "bg-secondary text-muted-foreground"
                        }`}>{s.step}</div>
                        <span className={`text-sm font-arabic ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Camera Guide */}
                <CameraGuide storeId={selectedStore.id} />

                {/* Connection Status */}
                <div className="rounded-xl bg-card border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Wifi className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground font-arabic">حالة الاتصال</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-xs text-muted-foreground font-arabic">رابط RTSP</span>
                      <Badge variant="outline" className={`text-[10px] ${selectedStore.rtsp_url ? "text-emerald border-emerald/30" : "text-accent border-accent/30"}`}>
                        {selectedStore.rtsp_url ? "مُعدّ" : "غير مُعدّ"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-xs text-muted-foreground font-arabic">الجهاز</span>
                      <Badge variant="outline" className={`text-[10px] ${selectedStore.hardware_choice ? "text-emerald border-emerald/30" : "text-accent border-accent/30"}`}>
                        {selectedStore.hardware_choice || "غير مُعدّ"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-muted-foreground font-arabic">حالة الاعتماد</span>
                      <Badge variant="outline" className={`text-[10px] ${storeStatusLabel(selectedStore.store_status).color}`}>
                        {storeStatusLabel(selectedStore.store_status).label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
