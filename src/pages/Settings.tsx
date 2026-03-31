import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, Store, CreditCard, Camera, Save, Upload } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Settings() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "store" | "billing">("profile");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Stores
  const [stores, setStores] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    setFullName(profile?.full_name || "");
    const load = async () => {
      const [stRes, subRes, profRes] = await Promise.all([
        supabase.from("stores").select("*").eq("user_id", user.id),
        supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("avatar_url").eq("id", user.id).single(),
      ]);
      if (stRes.data) setStores(stRes.data);
      if (subRes.data) setSubs(subRes.data);
      if (profRes.data?.avatar_url) setAvatarUrl(profRes.data.avatar_url);
    };
    load();
  }, [user, profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    if (error) toast.error("خطأ في الحفظ");
    else toast.success("تم تحديث الملف الشخصي");
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (newPassword !== confirmPassword) { toast.error("كلمة المرور غير متطابقة"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("تم تغيير كلمة المرور بنجاح"); setNewPassword(""); setConfirmPassword(""); }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error("خطأ في رفع الصورة"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    setAvatarUrl(urlData.publicUrl);
    toast.success("تم تحديث الصورة الشخصية");
    setUploading(false);
  };

  const handleStoreUpdate = async (storeId: string, name: string) => {
    const { error } = await supabase.from("stores").update({ name }).eq("id", storeId);
    if (error) toast.error("خطأ في تحديث المتجر");
    else toast.success("تم تحديث اسم المتجر");
  };

  const tierNameAr = (t: string) => t === "basic" ? "الأساسي" : t === "pro" ? "الاحترافي" : "المؤسسي";
  const statusAr = (s: string) => s === "active" ? "نشط" : s === "pending" ? "قيد المراجعة" : s === "rejected" ? "مرفوض" : s;

  const tabs = [
    { id: "profile" as const, label: "الملف الشخصي", icon: User },
    { id: "store" as const, label: "إعدادات المتجر", icon: Store },
    { id: "billing" as const, label: "الفواتير", icon: CreditCard },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-foreground font-arabic">الإعدادات</h1>
          <p className="text-sm text-muted-foreground mt-1 font-arabic">إدارة حسابك ومتاجرك</p>
        </motion.div>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-arabic transition-all ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-4 font-arabic">المعلومات الشخصية</h3>
              <div className="flex items-start gap-6">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-emerald flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-primary-foreground">{fullName?.[0] || "S"}</span>
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload className="w-5 h-5 text-foreground" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} disabled={uploading} />
                  </label>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground font-arabic">الاسم الكامل</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 bg-secondary border-border font-arabic" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-arabic">البريد الإلكتروني</Label>
                    <Input value={user?.email || ""} disabled className="mt-1 bg-secondary/50 border-border font-mono text-muted-foreground" />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving} className="font-arabic">
                    <Save className="w-4 h-4 me-2" /> {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-4 font-arabic">تغيير كلمة المرور</h3>
              <div className="max-w-sm space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground font-arabic">كلمة المرور الجديدة</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-arabic">تأكيد كلمة المرور</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <Button onClick={handleChangePassword} variant="outline" className="font-arabic border-accent/30 text-accent hover:bg-accent/10">
                  <Lock className="w-4 h-4 me-2" /> تغيير كلمة المرور
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "store" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {stores.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm font-arabic">لا توجد متاجر مسجلة</div>
            ) : (
              stores.map((store) => (
                <div key={store.id} className="rounded-xl bg-card border border-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground font-arabic">اسم المتجر</Label>
                        <Input
                          defaultValue={store.name}
                          onBlur={(e) => { if (e.target.value !== store.name) handleStoreUpdate(store.id, e.target.value); }}
                          className="mt-1 bg-secondary border-border font-arabic"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{store.id.slice(0, 12)}...</span>
                        <Badge variant="outline" className={`text-[10px] ${store.is_active ? "text-emerald border-emerald/30" : "text-accent border-accent/30"}`}>
                          {store.is_active ? "نشط" : "معطل"}
                        </Badge>
                        {store.hardware_choice && <Badge variant="outline" className="text-[10px]">{store.hardware_choice}</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "billing" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-xl bg-card border border-border p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 font-arabic">سجل الاشتراكات</h3>
              {subs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm font-arabic">لا توجد اشتراكات</p>
              ) : (
                <div className="space-y-3">
                  {subs.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
                      <div>
                        <p className="text-sm font-bold text-foreground font-arabic">باقة {tierNameAr(sub.tier)}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{new Date(sub.created_at).toLocaleDateString("ar-SA")}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-foreground font-mono">{sub.price_sar} ر.س/شهر</p>
                        <Badge variant="outline" className={`text-[10px] mt-1 ${sub.status === "active" ? "text-emerald border-emerald/30" : "text-accent border-accent/30"}`}>
                          {statusAr(sub.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
