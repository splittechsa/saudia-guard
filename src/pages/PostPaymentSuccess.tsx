import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Rocket, BookOpen, CalendarDays, ArrowLeft, Loader2, XCircle } from "lucide-react";
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

  // Fetch initial status + subscribe to realtime changes
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
              toast.success("🎉 تم تفعيل اشتراكك بنجاح!");
            } else if (newStatus === "inactive" || newStatus === "cancelled") {
              toast.error("فشل تفعيل الاشتراك — يرجى المحاولة مرة أخرى");
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
      title: "تفعيل آلي",
      description: "إذا نجح فحص الكاميرا — ابدأ الآن فوراً",
      action: () => navigate("/dashboard/store-setup"),
      color: "text-emerald",
      bgColor: "bg-emerald/5 border-emerald/20 hover:border-emerald/40",
      buttonLabel: "ابدأ الآن",
    },
    {
      icon: BookOpen,
      title: "دليل المساعدة",
      description: "فيديوهات وصور توضيحية لنوع كاميرتك",
      action: () => navigate("/dashboard/store-setup"),
      color: "text-primary",
      bgColor: "bg-primary/5 border-primary/20 hover:border-primary/40",
      buttonLabel: "عرض الدليل",
    },
    {
      icon: CalendarDays,
      title: "حجز موعد",
      description: "احجز جلسة مع فريقنا التقني لربط الكاميرا يدوياً",
      action: () => navigate("/dashboard/book-appointment"),
      color: "text-accent",
      bgColor: "bg-accent/5 border-accent/20 hover:border-accent/40",
      buttonLabel: "احجز الآن",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8 py-8">
        <AnimatePresence mode="wait">
          {status === "pending" && (
            <motion.div
              key="pending"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-foreground font-arabic">
                جاري تأكيد الدفع...
              </h1>
              <p className="text-sm text-muted-foreground font-arabic">
                يرجى الانتظار بينما نتحقق من عملية الدفع. سيتم التحديث تلقائياً.
              </p>
            </motion.div>
          )}

          {status === "active" && (
            <motion.div
              key="active"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-emerald/10 border-2 border-emerald/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-emerald" />
              </div>
              <h1 className="text-2xl font-bold text-foreground font-arabic">
                🎉 تم الدفع بنجاح!
              </h1>
              <p className="text-sm text-muted-foreground font-arabic">
                مبروك! اشتراكك مفعّل الآن. اختر الخطوة التالية:
              </p>
            </motion.div>
          )}

          {(status === "inactive" || status === "cancelled") && (
            <motion.div
              key="failed"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground font-arabic">
                فشل الدفع
              </h1>
              <p className="text-sm text-muted-foreground font-arabic">
                لم تتم عملية الدفع بنجاح. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.
              </p>
              <Button
                onClick={() => navigate("/onboarding")}
                className="bg-primary text-primary-foreground font-arabic mt-2"
              >
                إعادة المحاولة
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options — only show when active */}
        {status === "active" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {options.map((opt, i) => (
              <motion.div
                key={opt.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                onClick={opt.action}
                className={`rounded-xl border p-6 cursor-pointer transition-all ${opt.bgColor}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center ${opt.color}`}>
                    <opt.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-foreground font-arabic">{opt.title}</h3>
                    <p className="text-xs text-muted-foreground font-arabic mt-0.5">{opt.description}</p>
                  </div>
                  <Button variant="outline" size="sm" className="font-arabic">
                    {opt.buttonLabel}
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="w-full font-arabic text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 me-2" /> العودة للوحة التحكم
        </Button>
      </div>
    </DashboardLayout>
  );
}
