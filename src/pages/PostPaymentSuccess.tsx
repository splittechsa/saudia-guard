import { motion } from "framer-motion";
import { CheckCircle, Rocket, BookOpen, CalendarDays, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";

export default function PostPaymentSuccess() {
  const navigate = useNavigate();

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
        {/* Success Header */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald/10 border-2 border-emerald/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-arabic">🎉 تم الدفع بنجاح!</h1>
          <p className="text-sm text-muted-foreground font-arabic">
            مبروك! اشتراكك مفعّل الآن. اختر الخطوة التالية:
          </p>
        </motion.div>

        {/* Options */}
        <div className="space-y-4">
          {options.map((opt, i) => (
            <motion.div
              key={opt.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
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
        </div>

        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="w-full font-arabic text-muted-foreground">
          <ArrowLeft className="w-4 h-4 me-2" /> العودة للوحة التحكم
        </Button>
      </div>
    </DashboardLayout>
  );
}
