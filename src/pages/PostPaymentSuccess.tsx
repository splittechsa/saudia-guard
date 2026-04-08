import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Rocket, BookOpen, CalendarDays, ArrowLeft, Loader2, XCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SubStatus = "pending" | "active" | "inactive" | "cancelled";

export default function PostPaymentSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<SubStatus>("pending");

  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data?.status) setStatus(data.status as SubStatus);
    };

    fetchStatus();

    const channel = supabase
      .channel("sub-status-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new?.status as SubStatus;
          if (newStatus) {
            setStatus(newStatus);
            if (newStatus === "active") {
              toast.success("🎉 أهلاً بك في سبلت تيك! تم تفعيل اشتراكك");
            } else if (newStatus === "inactive" || newStatus === "cancelled") {
              toast.error("لم تكتمل عملية التفعيل، يرجى التواصل مع الدعم");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const options = [
    {
      icon: Rocket,
      title: "الإعداد السريع",
      description: "اربط كاميرتك الآن فوراً عبر نظام التفعيل الآلي الذكي",
      action: () => navigate("/dashboard/store-setup"),
      color: "text-primary",
      bgColor: "bg-primary/5 border-primary/20 hover:border-primary/40",
      buttonLabel: "ابدأ الربط",
    },
    {
      icon: BookOpen,
      title: "دليل سبلت تيك",
      description: "تعرف على كيفية ضبط الكاميرات للحصول على أدق التحليلات",
      action: () => navigate("/dashboard/store-setup"),
      color: "text-foreground",
      bgColor: "bg-secondary/50 border-border hover:border-muted-foreground/30",
      buttonLabel: "فتح الدليل",
    },
    {
      icon: CalendarDays,
      title: "دعم فني متخصص",
      description: "احجز جلسة عن بعد مع فريقنا التقني لضبط الإعدادات لك",
      action: () => navigate("/dashboard/book-appointment"),
      color: "text-accent",
      bgColor: "bg-accent/5 border-accent/20 hover:border-accent/40",
      buttonLabel: "حجز موعد",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-12 px-4 relative overflow-hidden" dir="rtl">
        {/* تأثيرات خلفية للهوية */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <AnimatePresence mode="wait">
          {status === "pending" && (
            <motion.div
              key="pending"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6 relative z-10"
            >
              <div className="w-24 h-24 rounded-3xl bg-secondary border border-border flex items-center justify-center mx-auto shadow-xl relative overflow-hidden">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-foreground font-arabic">جاري توثيق العملية...</h1>
                <p className="text-sm text-muted-foreground font-arabic">نحن نتحقق الآن من استلام الدفعة عبر بوابة Tap الآمنة</p>
              </div>
            </motion.div>
          )}

          {status === "active" && (
            <motion.div
              key="active"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6 relative z-10"
            >
              <div className="w-24 h-24 rounded-[2rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto shadow-2xl shadow-primary/10 relative">
                <CheckCircle className="w-12 h-12 text-primary" />
                <motion.div 
                   animate={{ scale: [1, 1.2, 1] }} 
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute -top-2 -right-2 bg-background p-1.5 rounded-full border border-border"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-foreground font-arabic tracking-tight">🎉 مبروك يا شريك!</h1>
                <p className="text-base text-muted-foreground font-arabic">تم تفعيل حسابك بنجاح. أنت الآن جاهز لرفع كفاءة متجرك بالذكاء الاصطناعي.</p>
              </div>

              {/* خيارات الانطلاق */}
              <div className="grid gap-4 mt-12 text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2 mb-2">الخطوات التالية الموصى بها</p>
                {options.map((opt, i) => (
                  <motion.div
                    key={opt.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={opt.action}
                    className={`group rounded-3xl border p-5 cursor-pointer transition-all duration-300 glass-strong shadow-sm hover:shadow-xl hover:-translate-y-1 ${opt.bgColor}`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center shadow-inner transition-colors group-hover:border-primary/30 ${opt.color}`}>
                        <opt.icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground font-arabic">{opt.title}</h3>
                        <p className="text-xs text-muted-foreground font-arabic mt-1 leading-relaxed">{opt.description}</p>
                      </div>
                      <Button variant="secondary" size="sm" className="font-bold rounded-xl h-10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        {opt.buttonLabel}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {(status === "inactive" || status === "cancelled") && (
            <motion.div
              key="failed"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6 relative z-10"
            >
              <div className="w-24 h-24 rounded-3xl bg-destructive/5 border-2 border-destructive/20 flex items-center justify-center mx-auto shadow-2xl shadow-destructive/5">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-foreground font-arabic">لم يكتمل الدفع</h1>
                <p className="text-sm text-muted-foreground font-arabic">نأسف، لم نتمكن من معالجة اشتراكك. يرجى مراجعة بيانات البطاقة أو المحاولة لاحقاً.</p>
              </div>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button
                    onClick={() => navigate("/onboarding")}
                    className="h-12 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20"
                >
                    إعادة محاولة الدفع
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => window.location.href = "mailto:info@splittech.sa"}
                    className="font-bold font-arabic"
                >
                    تواصل مع الدعم الفني
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="font-bold font-arabic text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 me-2" /> تخطي للوحة التحكم
            </Button>
            
            <div className="flex items-center gap-6 opacity-30 grayscale grayscale-0">
                 <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tighter">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    Secure Integration
                 </div>
                 <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">
                    SPLIT TECH · 2026
                 </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}