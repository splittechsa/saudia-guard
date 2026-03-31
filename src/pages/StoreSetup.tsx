import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Wifi, Power, PowerOff, Save, Eye, EyeOff, Clock, Plus, Settings } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
      const { data } = await supabase.from("stores").select("id, name, rtsp_url, camera_username, camera_password, hardware_choice, is_active, operating_hours").eq("user_id", user.id);
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
    if (!rtspUrl.trim()) {
      toast.error("الرجاء إدخال رابط RTSP");
      return;
    }
    if (!RTSP_REGEX.test(rtspUrl.trim())) {
      toast.error("صيغة رابط RTSP غير صحيحة. مثال: rtsp://192.168.1.100:554/stream1");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      rtsp_url: rtspUrl.trim(),
      camera_username: camUser.trim() || null,
      camera_password: camPass.trim() || null,
    }).eq("id", selectedStore.id);

    if (error) {
      toast.error("فشل حفظ الإعدادات: " + error.message);
    } else {
      toast.success("تم حفظ إعدادات الكاميرا بنجاح");
      setStores((prev) => prev.map((s) => s.id === selectedStore.id ? { ...s, rtsp_url: rtspUrl, camera_username: camUser, camera_password: camPass } : s));
    }
    setSaving(false);
  };

  const toggleActive = async () => {
    if (!selectedStore) return;
    const newActive = !selectedStore.is_active;
    const { error } = await supabase.from("stores").update({ is_active: newActive }).eq("id", selectedStore.id);
    if (error) {
      toast.error("فشل تحديث الحالة");
    } else {
      toast.success(newActive ? "تم تفعيل المتجر" : "تم إيقاف المتجر");
      setSelectedStore({ ...selectedStore, is_active: newActive });
      setStores((prev) => prev.map((s) => s.id === selectedStore.id ? { ...s, is_active: newActive } : s));
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
          <p className="text-sm text-muted-foreground mt-1 font-arabic">ربط الكاميرا وتفعيل التدقيق المباشر</p>
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
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => selectStore(store)}
                  className={`w-full text-right p-4 rounded-xl border transition-all ${
                    selectedStore?.id === store.id ? "bg-primary/10 border-primary" : "bg-card border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-2.5 h-2.5 rounded-full ${store.is_active ? "bg-emerald animate-pulse" : "bg-muted-foreground"}`} />
                    <div className="flex-1 me-3">
                      <p className="text-sm font-semibold text-foreground font-arabic">{store.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{store.hardware_choice || "بدون جهاز"}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Camera Setup */}
            {selectedStore && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-4">
                {/* Status Bar */}
                <div className="flex items-center justify-between rounded-xl bg-card border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedStore.is_active ? "bg-emerald animate-pulse" : "bg-destructive"}`} />
                    <div>
                      <p className="text-sm font-semibold text-foreground font-arabic">{selectedStore.name}</p>
                      <Badge variant="outline" className={`text-[10px] mt-1 ${selectedStore.is_active ? "text-emerald border-emerald/30" : "text-destructive border-destructive/30"}`}>
                        {selectedStore.is_active ? "نشط — يتم التدقيق" : "متوقف"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={toggleActive}
                    className={`font-arabic ${selectedStore.is_active ? "text-destructive border-destructive/30 hover:bg-destructive/10" : "text-emerald border-emerald/30 hover:bg-emerald/10"}`}
                  >
                    {selectedStore.is_active ? <><PowerOff className="w-4 h-4 me-2" /> إيقاف</> : <><Power className="w-4 h-4 me-2" /> تفعيل</>}
                  </Button>
                </div>

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
                        />
                        <button onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 font-arabic">
                      <Save className="w-4 h-4 me-2" /> {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
                    </Button>
                  </div>
                </div>

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
                      <span className="text-xs text-muted-foreground font-arabic">حالة التدقيق</span>
                      <Badge variant="outline" className={`text-[10px] ${selectedStore.is_active ? "text-emerald border-emerald/30" : "text-destructive border-destructive/30"}`}>
                        {selectedStore.is_active ? "مباشر" : "متوقف"}
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
