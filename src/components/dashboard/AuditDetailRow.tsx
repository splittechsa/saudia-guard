import { useState } from "react";
import { 
  ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, 
  AlertTriangle, Minus, LayoutGrid, Info, Search 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ... (نفس الـ Interface السابقة)

export function AuditDetailRow({ audit, storeName }: AuditDetailRowProps) {
  const [expanded, setExpanded] = useState(false);

  const extractQA = (): { question: string; answer: string }[] => {
    const source = audit.observations || audit.result;
    if (!source || typeof source !== "object") return [];
    if (Array.isArray(source)) {
      return source.map((item: any) => ({
        question: item.question || item.q || "—",
        answer: item.answer || item.a || item.result || "—",
      }));
    }
    return Object.entries(source).map(([k, v]) => ({
      question: k,
      answer: String(v),
    }));
  };

  const questions = extractQA();

  // تحليل متقدم للنص العربي لتحديد اللون
  const getAnswerInfo = (answer: string) => {
    const lower = answer.toLowerCase();
    const positiveWords = ["نعم", "yes", "true", "متوفر", "ملتزم", "نظيف", "موجود", "مرتب", "مكتمل", "مطابق"];
    const negativeWords = ["لا", "no", "false", "غير", "مخالف", "متسخ", "غائب", "ناقص", "فشل"];
    
    if (positiveWords.some(word => lower.includes(word))) {
      return { color: "text-emerald", bg: "bg-emerald/5", border: "border-emerald/10", icon: CheckCircle };
    }
    if (negativeWords.some(word => lower.includes(word))) {
      return { color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/10", icon: XCircle };
    }
    return { color: "text-accent", bg: "bg-accent/5", border: "border-accent/10", icon: AlertTriangle };
  };

  const scoreTheme = audit.score !== null
    ? audit.score >= 80 ? { text: "text-emerald", border: "border-emerald/30", bg: "bg-emerald/5" }
    : audit.score >= 50 ? { text: "text-accent", border: "border-accent/30", bg: "bg-accent/5" }
    : { text: "text-destructive", border: "border-destructive/30", bg: "bg-destructive/5" }
    : { text: "text-muted-foreground", border: "border-border", bg: "bg-secondary/20" };

  const timeStr = new Date(audit.created_at).toLocaleString("ar-SA", {
    hour: "2-digit", minute: "2-digit", day: "numeric", month: "short"
  });

  return (
    <motion.div 
      layout
      className={`rounded-[1.5rem] border transition-all duration-300 overflow-hidden ${
        expanded ? "border-primary/30 shadow-xl shadow-primary/5 ring-1 ring-primary/10" : "border-border/50 bg-secondary/10 hover:border-primary/20"
      }`}
      dir="rtl"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-right"
      >
        {/* Score Display */}
        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0 ${scoreTheme.border} ${scoreTheme.bg}`}>
          <span className={`text-lg font-black font-mono leading-none ${scoreTheme.text}`}>
            {audit.score !== null ? audit.score : "—"}
          </span>
          <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter mt-1">SCORE</span>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-base font-black text-foreground font-arabic truncate">{storeName}</span>
            <Badge variant="secondary" className="text-[9px] font-mono bg-background/50 text-muted-foreground h-5">
              <Clock className="w-2.5 h-2.5 ml-1" /> {timeStr}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald" />
               <span className="text-[10px] font-bold text-muted-foreground font-arabic">
                 {questions.filter(q => getAnswerInfo(q.answer).color === "text-emerald").length} مطابق
               </span>
            </div>
            <div className="flex items-center gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
               <span className="text-[10px] font-bold text-muted-foreground font-arabic">
                 {questions.filter(q => getAnswerInfo(q.answer).color === "text-destructive").length} مخالف
               </span>
            </div>
          </div>
        </div>

        <div className={`p-2 rounded-xl transition-colors ${expanded ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          {expanded ? <Search className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4 border-t border-border/30 pt-6 bg-secondary/5">
              
              {/* AI Insight Section */}
              {audit.summary && (
                <div className="p-4 rounded-2xl bg-background/50 border border-border/50 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-1 h-full bg-primary/40" />
                   <div className="flex items-center gap-2 mb-2">
                      <LayoutGrid className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black font-arabic text-primary uppercase tracking-widest">ملخص المحرك الذكي</span>
                   </div>
                   <p className="text-sm text-foreground font-arabic leading-relaxed">
                     {audit.summary}
                   </p>
                </div>
              )}

              {/* Detailed Q&A Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {questions.map((q, i) => {
                  const style = getAnswerInfo(q.answer);
                  const Icon = style.icon;
                  return (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`rounded-2xl p-4 ${style.bg} border ${style.border} flex items-start gap-4 transition-all hover:scale-[1.02]`}
                    >
                      <div className={`p-2 rounded-xl bg-background shadow-sm ${style.color}`}>
                         <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground/70 font-arabic leading-tight">{q.question}</p>
                        <p className={`text-sm font-black font-arabic ${style.color}`}>{q.answer}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Audit Metadata Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border/20 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">
                <span>ID: {audit.id.split('-')[0]}</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> SPLIT TECH CORE SECURED
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// مكون Badge بسيط للتنسيق
function Badge({ children, className, variant = "secondary" }: any) {
  return (
    <span className={`px-2 py-0.5 rounded-full font-bold flex items-center ${className}`}>
      {children}
    </span>
  );
}

function ShieldCheck({ className }: any) {
  return <CheckCircle className={className} />;
}