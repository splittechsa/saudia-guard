import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "الأساسي",
    nameEn: "BASIC",
    price: "299",
    popular: false,
    features: [
      "تغطية 12 ساعة يومياً",
      "حتى 5 أسئلة مخصصة",
      "تقارير يومية",
      "دعم فني بالتذاكر",
    ],
    cta: "ابدأ الآن",
  },
  {
    name: "الاحترافي",
    nameEn: "PRO",
    price: "499",
    popular: true,
    features: [
      "تغطية 18 ساعة يومياً",
      "حتى 15 سؤالاً مخصصاً",
      "تقارير + تحليل أسبوعي",
      "دعم فني بالأولوية + دردشة ذكية",
    ],
    cta: "ابدأ الآن",
  },
  {
    name: "المؤسسي",
    nameEn: "ENTERPRISE",
    price: "899",
    popular: false,
    features: [
      "تغطية 24 ساعة يومياً",
      "أسئلة غير محدودة",
      "تنبيهات واتساب فورية",
      "مدير حساب مخصص",
      "تكامل ERP",
    ],
    cta: "تواصل معنا",
  },
];

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
          باقات تناسب <span className="text-gradient-lime">كل نشاط</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-3">ابدأ بدون عقود سنوية. ألغِ في أي وقت.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5 items-stretch">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-2xl p-6 sm:p-7 transition-all duration-500 hover-glow ${
              plan.popular
                ? "border-2 border-primary/40 bg-card/80 scale-[1.02] glow-lime"
                : "border border-border/30 bg-card/40"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                <Star className="w-3 h-3" />
                الأكثر طلباً
              </div>
            )}

            <div className="mb-6">
              <span className="text-[10px] font-mono text-primary/50 tracking-widest">{plan.nameEn}</span>
              <h3 className="text-lg font-bold text-foreground mt-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">ر.س/شهر</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((f, fi) => (
                <li key={fi} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => navigate("/signup")}
              className={`w-full h-11 text-sm font-semibold transition-all ${
                plan.popular
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-foreground hover:bg-secondary/80 border border-border/30"
              }`}
            >
              {plan.cta}
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
