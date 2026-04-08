import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, ChevronRight, ExternalLink, LifeBuoy, 
  CheckCircle, ArrowRight, Info, Copy, Globe, ShieldQuestion 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ... (نفس مصفوفة CAMERA_BRANDS السابقة)

export function CameraGuide({ storeId, onRequestSupport }: Props) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const { user } = useAuth();
  const brand = CAMERA_BRANDS.find((b) => b.id === selectedBrand);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ القالب البرمجي");
  };

  const handleRequestSupport = async () => {
    if (!user) return;
    if (onRequestSupport) { onRequestSupport(); return; }
    
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      store_id: storeId || null,
      subject: "طلب مساعدة تقنية: ربط الكاميرا",
      description: `العميل يطلب المساعدة في ربط كاميرا من نوع ${brand?.name || "غير محدد"}. يرجى التواصل لتقديم الدعم عن بعد أو ميدانياً.`,
      priority: "high",
      status: "open"
    });

    if (error) {
      toast.error("فشل إرسال طلب المساعدة");
    } else {
      toast.success("🚀 تم إرسال طلبك لفريق الدعم التقني بنجاح!");
    }
  };

  return (
    <div className="glass-strong rounded-[2rem] border border-border p-8 space-y-6 relative overflow-hidden" dir="rtl">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
          <Globe className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground font-arabic tracking-tight">مساعد الإعداد الذكي</h3>
          <p className="text-xs text-muted-foreground font-arabic mt-1 text-right">اختر الشركة المصنعة لكاميراتك للحصول على التعليمات</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedBrand ? (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10"
          >
            {CAMERA_BRANDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(b.id)}
                className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-secondary/30 border border-border/50 hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300 text-right"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {b.logo}
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{b.name}</p>
                    <p className="text-[10px] text-muted-foreground font-arabic">{b.nameAr}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-[-4px] transition-transform" />
              </button>
            ))}
            
            <div className="sm:col-span-2 p-4 rounded-2xl bg-accent/5 border border-accent/20 flex items-start gap-3">
               <Info className="w-4 h-4 text-accent mt-0.5" />
               <p className="text-[10px] text-muted-foreground font-arabic leading-relaxed">
                 إذا لم تجد ماركة كاميرتك في القائمة، اختر "أخرى" أو تواصل مع فريق سبلت تيك للحصول على الدعم المباشر.
               </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 relative z-10"
          >
            <div className="flex items-center justify-between bg-secondary/20 p-4 rounded-2xl border border-border/50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{brand?.logo}</span>
                <p className="text-sm font-black text-foreground font-arabic">تعليمات الربط لـ {brand?.nameAr}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBrand(null)} className="text-[10px] font-bold font-arabic hover:bg-background h-8">
                تغيير الماركة
              </Button>
            </div>

            {/* RTSP Terminal Section */}
            <div className="space-y-2">
               <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RTSP Template Structure</p>
                  <button onClick={() => copyToClipboard(brand?.rtspTemplate || "")} className="text-primary hover:scale-110 transition-transform">
                     <Copy className="w-3.5 h-3.5" />
                  </button>
               </div>
               <div className="rounded-xl bg-background border border-border p-4 font-mono text-[11px] text-primary relative group overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <code className="relative z-10 break-all leading-relaxed">
                    {brand?.rtspTemplate}
                  </code>
               </div>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-3">
              <p className="text-xs font-black text-foreground font-arabic flex items-center gap-2">
                 <ShieldQuestion className="w-4 h-4 text-primary" /> خطوات الضبط الفني:
              </p>
              <div className="grid gap-2">
                {brand?.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/10 border border-border/30 hover:border-primary/20 transition-colors">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-background border border-border flex items-center justify-center text-[10px] font-black text-primary">
                      {i + 1}
                    </span>
                    <p className="text-xs text-muted-foreground font-arabic leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Support CTA */}
            <div className="pt-4 border-t border-border/50">
               <Button 
                onClick={handleRequestSupport} 
                className="w-full h-12 bg-accent text-white hover:bg-accent/90 rounded-xl font-bold font-arabic shadow-lg shadow-accent/10 transition-all group"
               >
                 <LifeBuoy className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
                 لم تنجح العملية؟ اطلب دعماً فنيًا فورياً
               </Button>
               <p className="text-[9px] text-muted-foreground/50 text-center mt-3 font-arabic">
                 * يتوفر فريقنا التقني للربط عن بعد عبر Anydesk أو الزيارات الميدانية.
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[8px] text-muted-foreground/30 font-mono tracking-[0.4em] uppercase">
        SplitTech Connectivity Helper · Jeddah Dev Lab
      </p>
    </div>
  );
}