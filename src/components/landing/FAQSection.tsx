import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  { q: "هل أحتاج كاميرات جديدة؟", a: "لا. يعمل مع أي كاميرا تدعم RTSP — وهو معيار موجود في 99% من الكاميرات المركبة بعد 2020." },
  { q: "من يرى الصور؟", a: "لا أحد. الذكاء الاصطناعي يحللها ويحذفها فوراً. لا يوجد موظف بشري يشاهد أي صورة." },
  { q: "كيف أعرف أن النظام يعمل؟", a: "لوحة التحكم تعرض حالة الاتصال لحظياً. وإذا انقطع أبلغناك." },
  { q: "هل يعمل مع مطعمي / صالوني / مغسلتي؟", a: "نعم. أنت تكتب أسئلتك بنفسك. النظام يجيب عليها بغض النظر عن نوع نشاطك." },
  { q: "ماذا لو لم يعجبني النظام؟", a: "يمكنك الإلغاء في أي وقت. لا عقود سنوية." },
  { q: "أين بياناتي؟", a: "سيرفرات Google Cloud منطقة الدمام (me-central2). داخل المملكة تماماً." },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground">الأسئلة الشائعة</h2>
      </motion.div>

      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-right hover:bg-card/50 transition-colors"
            >
              <span className="text-sm font-semibold text-foreground">{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${openIndex === i ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
