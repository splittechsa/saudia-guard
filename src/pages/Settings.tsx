import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Lock, Store, CreditCard, Save, Upload, 
  Power, Trash2, AlertTriangle, XCircle, ShieldCheck,
  Mail, Building, Calendar, BadgeCheck
} from "lucide-react";
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

  const [confirmAction, setConfirmAction] = useState<null | { type: string; id?: string; label: string }>(null);
  const [confirmText, setConfirmText] = useState("");

  // ... (نفس الـ useEffect والـ Load functions السابقة)

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 py-4" dir="rtl">
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-black text-foreground font-arabic">إعدادات المنصة</h1>
            <p className="text-sm text-muted-foreground font-arabic mt-1">إدارة الملف الشخصي، المتاجر، وتفاصيل الاشتراكات الرقمية</p>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-xl border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                  ? "bg-background text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-arabic">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ═══ PROFILE TAB ═══ */}
          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-strong rounded-3xl p-8 border border-border">
                  <h3 className="text-lg font-bold text-foreground font-arabic mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> المعلومات الأساسية
                  </h3>
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-[2rem] bg-secondary border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden shadow-inner">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-black text-primary/40">{fullName?.[0] || "S"}</span>
                          )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} disabled={uploading} />
                        </label>
                      </div>
                      <div className="flex-1 w-full space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground font-arabic mr-1">الاسم التجاري / الكامل</Label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-secondary/50 border-border rounded-xl h-12" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground font-arabic mr-1">البريد الرسمي</Label>
                            <div className="relative">
                                <Input value={user?.email || ""} disabled className="bg-muted border-border rounded-xl h-12 pr-10 font-mono text-xs" />
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            </div>
                          </div>
                        </div>
                        <Button onClick={handleSaveProfile} disabled={saving} className="bg-primary text-primary-foreground font-bold rounded-xl px-8">
                          {saving ? "جاري الحفظ..." : "تحديث الملف"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-strong rounded-3xl p-8 border border-border">
                  <h3 className="text-lg font-bold text-foreground font-arabic mb-6 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" /> أمان الحساب
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground font-arabic">كلمة المرور الجديدة</Label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-secondary/50 border-border rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground font-arabic">تأكيد الكلمة</Label>
                      <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-secondary/50 border-border rounded-xl h-12" />
                    </div>
                  </div>
                  <Button onClick={handleChangePassword} variant="outline" className="mt-6 border-primary/20 hover:bg-primary/5 font-bold rounded-xl">
                    تحديث كلمة المرور
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-strong rounded-3xl p-6 border border-border text-center">
                  <ShieldCheck className="w-12 h-12 text-emerald mx-auto mb-4" />
                  <h4 className="font-bold text-foreground font-arabic">حالة التوثيق</h4>
                  <p className="text-[10px] text-muted-foreground font-arabic mt-1">حسابك موثق لدى سبلت تيك ومتوافق مع أنظمة PDPL</p>
                  <Badge className="mt-4 bg-emerald/10 text-emerald border-emerald/20 hover:bg-emerald/10">مستخدم موثق</Badge>
                </div>

                <div className="glass-strong rounded-3xl p-6 border border-destructive/10 bg-destructive/[0.02]">
                  <h4 className="text-sm font-bold text-destructive font-arabic mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> حذف الحساب
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-arabic leading-relaxed mb-4">
                    سيؤدي حذف الحساب إلى إتلاف جميع التقارير وإيقاف المتاجر بشكل نهائي.
                  </p>
                  <Button 
                    variant="ghost" 
                    onClick={() => setConfirmAction({ type: "delete_account", label: "حذف الحساب نهائياً" })}
                    className="w-full text-destructive hover:bg-destructive/10 rounded-xl text-xs font-bold"
                  >
                    بدء عملية الحذف
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ STORE TAB ═══ */}
          {activeTab === "store" && (
            <motion.div key="store" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stores.map((store) => (
                    <div key={store.id} className="glass-strong rounded-[2rem] p-8 border border-border hover:border-primary/30 transition-all group">
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Building className="w-7 h-7" />
                            </div>
                            <Badge variant="outline" className={`rounded-lg ${store.is_active ? "bg-emerald/5 text-emerald border-emerald/20" : "bg-accent/5 text-accent border-accent/20"}`}>
                                {store.is_active ? "تدقيق نشط" : "متوقف مؤقتاً"}
                            </Badge>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Store Identity</Label>
                                <Input 
                                    defaultValue={store.name} 
                                    className="bg-secondary/30 border-border h-12 rounded-xl font-bold" 
                                    onBlur={(e) => handleStoreUpdate(store.id, e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50">
                                <div>
                                    <p className="text-xs font-bold text-foreground font-arabic">حالة التشغيل</p>
                                    <p className="text-[10px] text-muted-foreground font-arabic">تحكم في تفعيل التدقيق الذكي</p>
                                </div>
                                <Switch checked={store.is_active} onCheckedChange={() => handleToggleStore(store.id, store.is_active)} />
                            </div>
                        </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {/* ═══ BILLING TAB ═══ */}
          {activeTab === "billing" && (
            <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="glass-strong rounded-[2.5rem] p-10 border border-border overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                        <CreditCard className="w-64 h-64 rotate-12" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground font-arabic mb-8">سجل الاشتراكات والفوترة</h3>
                    
                    <div className="space-y-4 relative z-10">
                        {subs.map((sub) => (
                            <div key={sub.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <BadgeCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground font-arabic">باقة سبلت تيك {tierNameAr(sub.tier)}</h4>
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" /> تم الاشتراك في: {new Date(sub.created_at).toLocaleDateString("ar-SA")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 mt-4 md:mt-0">
                                    <div className="text-left md:text-right">
                                        <p className="text-lg font-black text-foreground">{sub.price_sar} <span className="text-[10px] font-normal text-muted-foreground">ر.س / شهر</span></p>
                                        <Badge className={`mt-1 ${sub.status === "active" ? "bg-emerald/10 text-emerald" : "bg-destructive/10 text-destructive"}`}>
                                            {statusAr(sub.status)}
                                        </Badge>
                                    </div>
                                    {sub.status === "active" && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                            onClick={() => setConfirmAction({ type: "cancel_sub", id: sub.id, label: "إيقاف الاشتراك" })}
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between p-8 glass-strong rounded-3xl border border-border border-dashed">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <img src={splitLogo} className="w-10 h-10" />
                        <div>
                            <p className="font-bold text-foreground font-arabic text-sm">تحتاج لمساعدة في الفوترة؟</p>
                            <p className="text-xs text-muted-foreground font-arabic">فريقنا المالي جاهز للرد على استفساراتك الضريبية</p>
                        </div>
                    </div>
                    <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 px-8 font-bold" asChild>
                        <a href="mailto:info@splittech.sa">تواصل معنا</a>
                    </Button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <p className="text-center text-[9px] text-muted-foreground/30 mt-12 font-mono tracking-[0.3em] uppercase">
          SplitTech Engine Management · Saudi Data Residency · PDPL Secure
        </p>
      </div>

      {/* Confirmation Modal - المودال بأسلوب سبلت تيك */}
      {/* ... (نفس الـ Logic الخاص بالمودال لكن مع تصميم الـrounded-3xl والـglass-strong) */}
    </DashboardLayout>
  );
}