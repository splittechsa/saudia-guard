import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "BASIC",
    price: "299",
    features: [
      "تغطية 12 ساعة يومياً",
      "حتى 5 أسئلة مخصصة",
      "تقارير يومية",
      "دعم فني بالتذاكر",
    ],
    cta: "ابدأ الآن",
    highlighted: false,
  },
  {
    name: "PRO",
    price: "499",
    badge: "الأكثر طلباً",
    features: [
      "تغطية 18 ساعة يومياً",
      "حتى 15 سؤالاً مخصصاً",
      "تقارير + تحليل أسبوعي",
      "دعم فني بالأولوية + دردشة ذكية",
    ],
    cta: "ابدأ الآن",
    highlighted: true,
  },
  {
    name: "ENTERPRISE",
    price: "899",
    features: [
      "تغطية 24 ساعة يومياً",
      "أسئلة غير محدودة",
      "تنبيهات واتساب فورية",
      "مدير حساب مخصص",
      "تكامل ERP",
    ],
    cta: "تواصل معنا",
    highlighted: false,
  },
];

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground">باقات تناسب كل نشاط</h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-xl border p-6 sm:p-8 relative flex flex-col ${
              plan.highlighted
                ? "bg-card border-primary glow-lime scale-[1.02]"
                : "bg-card border-border"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {plan.badge}
              </div>
            )}
            <div className="mb-6">
              <p className="text-xs font-mono text-muted-foreground tracking-widest mb-2">{plan.name}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">ر.س/شهر</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => navigate("/signup")}
              className={`w-full ${plan.highlighted ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
            >
              {plan.cta}
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
