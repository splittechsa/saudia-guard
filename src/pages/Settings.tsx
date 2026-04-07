import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, Store, CreditCard, Save, Upload, Power, Trash2, AlertTriangle, XCircle, Shield } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import splitLogo from "@/assets/split-logo-icon.png";

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profile" | "store" | "billing">("profile");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [stores, setStores] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);

  // Confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<null | { type: string; id?: string; label: string }>(null);
  const [confirmText, setConfirmText] = useState("");

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

  const reload = async () => {
    if (!user) return;
    const [stRes, subRes] = await Promise.all([
      supabase.from("stores").select("*").eq("user_id", user.id),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (stRes.data) setStores(stRes.data);
    if (subRes.data) setSubs(subRes.data);
  };

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

  const handleToggleStore = async (storeId: string, currentActive: boolean) => {
    const { error } = await supabase.from("stores").update({ is_active: !currentActive }).eq("id", storeId);
    if (error) toast.error("خطأ في تحديث حالة المتجر");
    else {
      toast.success(!currentActive ? "تم تفعيل المتجر" : "تم إيقاف المتجر");
      reload();
    }
  };

  const handleCancelSubscription = async (subId: string) => {
    const { error } = await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", subId);
    if (error) toast.error("خطأ في إلغاء الاشتراك");
    else {
      toast.success("تم إلغاء الاشتراك بنجاح");
      // Deactivate all stores
      if (user) {
        await supabase.from("stores").update({ is_active: false }).eq("user_id", user.id);
      }
      reload();
    }
    setConfirmAction(null);
    setConfirmText("");
  };

  const handleDeleteAccount = async () => {
    // We can't delete auth user from client, but we deactivate everything
    if (!user) return;
    await supabase.from("stores").update({ is_active: false }).eq("user_id", user.id);
    await supabase.from("subscriptions").update({ status: "cancelled" }).eq("user_id", user.id);
    await supabase.from("profiles").update({ full_name: "[محذوف]", email: null }).eq("id", user.id);
    toast.success("تم إلغاء تفعيل الحساب. سيتم تسجيل خروجك.");
    setConfirmAction(null);
    setConfirmText("");
    setTimeout(async () => {
      await signOut();
      navigate("/");
    }, 1500);
  };

  const tierNameAr = (t: string) => t === "basic" ? "الأساسي" : t === "pro" ? "الاحترافي" : "المؤسسي";
  const statusAr = (s: string) => s === "active" ? "نشط" : s === "pending" ? "قيد المراجعة" : s === "cancelled" ? "ملغى" : s === "rejected" ? "مرفوض" : s;

  const tabs = [
    { id: "profile" as const, label: "الملف الشخصي", icon: User },
    { id: "store" as const, label: "إعدادات المتجر", icon: Store },
    { id: "billing" as const, label: "الفواتير والاشتراك", icon: CreditCard },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة حسابك ومتاجرك واشتراكك</p>
        </motion.div>

        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ PROFILE TAB ═══ */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-4">المعلومات الشخصية</h3>
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
                    <Label className="text-xs text-muted-foreground">الاسم الكامل</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
                    <Input value={user?.email || ""} disabled className="mt-1 bg-secondary/50 border-border font-mono text-muted-foreground" />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="w-4 h-4 me-2" /> {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-4">تغيير كلمة المرور</h3>
              <div className="max-w-sm space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">كلمة المرور الجديدة</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">تأكيد كلمة المرور</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <Button onClick={handleChangePassword} variant="outline" className="border-accent/30 text-accent hover:bg-accent/10">
                  <Lock className="w-4 h-4 me-2" /> تغيير كلمة المرور
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl bg-destructive/[0.04] border border-destructive/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h3 className="text-sm font-bold text-destructive">منطقة الخطر</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">حذف الحساب سيؤدي إلى إلغاء جميع الاشتراكات وإيقاف جميع المتاجر. هذا الإجراء لا يمكن التراجع عنه.</p>
              <Button
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmAction({ type: "delete_account", label: "حذف الحساب" })}
              >
                <Trash2 className="w-4 h-4 me-2" /> حذف الحساب
              </Button>
            </div>
          </motion.div>
        )}

        {/* ═══ STORE TAB ═══ */}
        {activeTab === "store" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {stores.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">لا توجد متاجر مسجلة</div>
            ) : (
              stores.map((store) => (
                <div key={store.id} className="rounded-xl bg-card border border-border p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">اسم المتجر</Label>
                        <Input
                          defaultValue={store.name}
                          onBlur={(e) => { if (e.target.value !== store.name) handleStoreUpdate(store.id, e.target.value); }}
                          className="mt-1 bg-secondary border-border"
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

                  {/* Store Controls */}
                  <div className="border-t border-border/30 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">تفعيل/إيقاف التدقيق</p>
                        <p className="text-[10px] text-muted-foreground">أوقف التدقيق الذكي مؤقتاً</p>
                      </div>
                      <Switch
                        checked={store.is_active ?? false}
                        onCheckedChange={() => handleToggleStore(store.id, store.is_active ?? false)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ═══ BILLING TAB ═══ */}
        {activeTab === "billing" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-xl bg-card border border-border p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">الاشتراكات</h3>
              {subs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">لا توجد اشتراكات</p>
              ) : (
                <div className="space-y-3">
                  {subs.map((sub) => (
                    <div key={sub.id} className="rounded-lg bg-secondary/30 border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-foreground">باقة {tierNameAr(sub.tier)}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-1">{new Date(sub.created_at).toLocaleDateString("ar-SA")}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-foreground font-mono">{sub.price_sar} ر.س/شهر</p>
                          <Badge variant="outline" className={`text-[10px] mt-1 ${sub.status === "active" ? "text-emerald border-emerald/30" : sub.status === "cancelled" ? "text-destructive border-destructive/30" : "text-accent border-accent/30"}`}>
                            {statusAr(sub.status)}
                          </Badge>
                        </div>
                      </div>

                      {sub.status === "active" && (
                        <div className="border-t border-border/20 pt-3 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">إلغاء الاشتراك سيوقف التدقيق الذكي على جميع متاجرك</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
                            onClick={() => setConfirmAction({ type: "cancel_sub", id: sub.id, label: `إلغاء باقة ${tierNameAr(sub.tier)}` })}
                          >
                            <XCircle className="w-3.5 h-3.5 me-1" /> إلغاء الاشتراك
                          </Button>
                        </div>
                      )}

                      {sub.status === "cancelled" && (
                        <div className="border-t border-border/20 pt-3">
                          <p className="text-xs text-muted-foreground">تم إلغاء هذا الاشتراك. يمكنك الاشتراك من جديد عبر صفحة الإعداد.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => navigate("/onboarding")}
                          >
                            اشترك مجدداً
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="rounded-xl bg-card/50 border border-border/30 p-5">
              <div className="flex items-center gap-3 mb-3">
                <img src={splitLogo} alt="Split Tech" className="w-6 h-6" />
                <h3 className="text-sm font-bold text-foreground">تواصل مع الدعم</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                لأي استفسارات حول الفوترة أو تغيير الباقة، تواصل معنا:
              </p>
              <a href="mailto:info@splittech.sa" className="text-sm text-primary hover:underline font-mono">info@splittech.sa</a>
            </div>
          </motion.div>
        )}

        {/* ═══ CONFIRMATION DIALOG ═══ */}
        {confirmAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm mx-4 rounded-2xl bg-card border border-border p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{confirmAction.label}</h3>
                  <p className="text-[10px] text-muted-foreground">هذا الإجراء لا يمكن التراجع عنه</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {confirmAction.type === "cancel_sub"
                  ? "سيتم إلغاء الاشتراك وإيقاف التدقيق الذكي على جميع المتاجر المرتبطة. يمكنك إعادة الاشتراك لاحقاً."
                  : "سيتم إلغاء جميع الاشتراكات وإيقاف جميع المتاجر وحذف بيانات الملف الشخصي."}
              </p>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  اكتب <span className="text-destructive font-bold font-mono">تأكيد</span> للمتابعة
                </Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="تأكيد"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setConfirmAction(null); setConfirmText(""); }}
                >
                  إلغاء
                </Button>
                <Button
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={confirmText !== "تأكيد"}
                  onClick={() => {
                    if (confirmAction.type === "cancel_sub" && confirmAction.id) {
                      handleCancelSubscription(confirmAction.id);
                    } else if (confirmAction.type === "delete_account") {
                      handleDeleteAccount();
                    }
                  }}
                >
                  {confirmAction.type === "cancel_sub" ? "إلغاء الاشتراك" : "حذف الحساب"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
