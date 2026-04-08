import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Cpu, Check, ArrowRight, ArrowLeft, ShieldCheck, Zap, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HardwareSetupProps {
  storeId: string;
  onComplete: () => void;
}

export default function HardwareSetup({ storeId, onComplete }: HardwareSetupProps) {
  const [step, setStep] = useState<"choice" | "credentials">("choice");
  const [hardwareChoice, setHardwareChoice] = useState<"software" | "hardware">("software");
  const [rtspUrl, setRtspUrl] = useState("");
  const [cameraUser, setCameraUser] = useState("");
  const [cameraPass, setCameraPass] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!rtspUrl.includes("rtsp://")) {
      toast.error("يرجى إدخال رابط RTSP صحيح يبدأ بـ rtsp://");
      return;
    }
    
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        hardware_choice: hardwareChoice,
        rtsp_url: rtspUrl.trim() || null,
        camera_username: cameraUser.trim() || null,
        camera_password: cameraPass.trim() || null,
        store_status: "pending_review" // تحديث الحالة تلقائياً للمراجعة
      } as any)
      .eq("id", storeId);

    if (error) {
      toast.error("فشل حفظ إعدادات الهاردوير");
    } else {
      toast.success("تم تكوين الخيارات بنجاح! جاري الانتقال للخطوة التالية.");
      onComplete();
    }
    setSaving(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="glass-strong rounded-[2.5rem] border border-border p-8 shadow-2xl relative overflow-hidden carbon-grid"
      dir="rtl"
    >
      {/* Header */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-2">
           <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Zap className="w-5 h-5" />
           </div>
           <h3 className="text-xl font-black text-foreground font-arabic tracking-tight">تهيئة نظام التشغيل</h3>
        </div>
        <p className="text-sm text-muted-foreground font-arabic">اختر الطريقة المفضلة لتشغيل محرك الذكاء الاصطناعي في متجرك.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === "choice" ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 relative z-10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { 
                  key: "software" as const, 
                  icon: Monitor, 
                  title: "ربط سحابي مباشر", 
                  desc: "التثبيت عبر السحابة دون الحاجة لأجهزة إضافية", 
                  price: "مشمول في الباقة" 
                },
                { 
                  key: "hardware" as const, 
                  icon: Cpu, 
                  title: "جهاز Split-Pi الذكي", 
                  desc: "معالج محلي مخصص لضمان استقرار البث والخصوصية", 
                  price: "+600 ر.س (مرة واحدة)" 
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setHardwareChoice(opt.key)}
                  className={`group relative rounded-[2rem] p-6 text-right border transition-all duration-300 ${
                    hardwareChoice === opt.key 
                    ? "bg-primary/5 border-primary shadow-xl shadow-primary/5" 
                    : "bg-secondary/30 border-border hover:border-primary/30"
                  }`}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 transition-colors ${
                    hardwareChoice === opt.key ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"
                  }`}>
                    <opt.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground font-arabic mb-1">{opt.title}</h4>
                  <p className="text-xs text-muted-foreground font-arabic leading-relaxed mb-4">{opt.desc}</p>
                  <div className="flex items-center justify-between mt-auto">
                     <span className={`text-xs font-bold font-arabic ${hardwareChoice === opt.key ? "text-primary" : "text-muted-foreground"}`}>
                        {opt.price}
                     </span>
                     {hardwareChoice === opt.key && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  
                  {opt.key === "hardware" && (
                    <div className="absolute top-4 left-4 bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Recommended
                    </div>
                  )}
                </button>
              ))}
            </div>

            <Button 
              onClick={() => setStep("credentials")} 
              className="w-full h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-xl shadow-primary/20 group transition-all"
            >
              المتابعة لإعداد الكاميرا 
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 relative z-10"
          >
            <div className="bg-secondary/30 rounded-2xl p-4 border border-border flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-emerald" />
               <span className="text-xs font-bold text-foreground font-arabic">
                 تم اختيار: {hardwareChoice === "hardware" ? "جهاز Split-Pi الذكي" : "الربط السحابي المباشر"}
               </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground font-arabic mr-1">رابط البث (RTSP URL)</Label>
                <div className="relative">
                  <Input
                    value={rtspUrl}
                    onChange={(e) => setRtspUrl(e.target.value)}
                    placeholder="rtsp://192.168.1.100:554/live"
                    className="bg-background border-border h-12 rounded-xl font-mono text-xs pr-10"
                    dir="ltr"
                  />
                  <Camera className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground font-arabic mr-1">اسم المستخدم</Label>
                  <Input 
                    value={cameraUser} 
                    onChange={(e) => setCameraUser(e.target.value)} 
                    placeholder="admin" 
                    className="bg-background border-border h-12 rounded-xl text-xs" 
                    dir="ltr" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground font-arabic mr-1">كلمة المرور</Label>
                  <Input 
                    type="password" 
                    value={cameraPass} 
                    onChange={(e) => setCameraPass(e.target.value)} 
                    placeholder="••••••••" 
                    className="bg-background border-border h-12 rounded-xl text-xs" 
                    dir="ltr" 
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setStep("choice")} 
                className="font-bold font-arabic rounded-xl"
              >
                رجوع
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex-1 h-12 bg-primary text-primary-foreground font-black rounded-xl shadow-lg shadow-primary/20"
              >
                {saving ? "جاري الحفظ..." : "تفعيل المتجر الآن"}
              </Button>
            </div>
            
            <p className="text-[10px] text-muted-foreground text-center font-arabic leading-relaxed">
              * سيقوم الفريق التقني بمراجعة جودة البث واعتماد المتجر خلال 24 ساعة عمل.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Blur */}
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
    </motion.div>
  );
}