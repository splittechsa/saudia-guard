import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "هل أحتاج كاميرات جديدة؟", a: "لا. يعمل مع أي كاميرا تدعم RTSP — وهو معيار موجود في 99% من الكاميرات المركبة بعد 2020." },
  { q: "من يرى الصور؟", a: "لا أحد. الذكاء الاصطناعي يحللها ويحذفها فوراً. لا يوجد موظف بشري يشاهد أي صورة." },
  { q: "كيف أعرف أن النظام يعمل؟", a: "لوحة التحكم تعرض حالة الاتصال لحظياً. وإذا انقطع أبلغناك." },
  { q: "هل يعمل مع مطعمي / صالوني / مغسلتي؟", a: "نعم. أنت تكتب أسئلتك بنفسك. النظام يجيب عليها بغض النظر عن نوع نشاطك." },
  { q: "ماذا لو لم يعجبني النظام؟", a: "يمكنك الإلغاء في أي وقت. لا عقود سنوية." },
  { q: "أين بياناتي؟", a: "سيرفرات Google Cloud منطقة الدمام (me-central2). داخل المملكة تماماً." },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function FAQSection() {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight-ar">الأسئلة الشائعة</h2>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants}>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={itemVariants}>
              <AccordionItem value={`faq-${i}`} className="border border-border/20 rounded-xl px-5 bg-card/15 hover:bg-card/30 transition-colors duration-300 data-[state=open]:bg-card/30 data-[state=open]:border-primary/15">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
