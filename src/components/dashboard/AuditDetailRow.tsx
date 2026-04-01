import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, AlertTriangle, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuditDetailRowProps {
  audit: {
    id: string;
    store_id: string;
    score: number | null;
    status: string | null;
    summary: string | null;
    result: any;
    observations: any;
    ai_reasoning: string | null;
    confidence_score: number | null;
    created_at: string;
  };
  storeName: string;
}

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

  const getAnswerInfo = (answer: string) => {
    const lower = answer.toLowerCase();
    if (lower.includes("نعم") || lower === "yes" || lower === "true" || lower.includes("متوفر") || lower.includes("ملتزم") || lower.includes("نظيف") || lower.includes("موجود") || lower.includes("مرتب")) {
      return { color: "text-emerald", bg: "bg-emerald/8", border: "border-emerald/15", icon: CheckCircle };
    }
    if (lower.includes("لا") || lower === "no" || lower === "false" || lower.includes("غير") || lower.includes("مخالف") || lower.includes("متسخ") || lower.includes("غائب")) {
      return { color: "text-destructive", bg: "bg-destructive/8", border: "border-destructive/15", icon: XCircle };
    }
    return { color: "text-accent", bg: "bg-accent/8", border: "border-accent/15", icon: AlertTriangle };
  };

  const scoreColor = audit.score !== null
    ? audit.score >= 80 ? "text-emerald" : audit.score >= 50 ? "text-accent" : "text-destructive"
    : "text-muted-foreground";

  const scoreBarColor = audit.score !== null
    ? audit.score >= 80 ? "bg-emerald" : audit.score >= 50 ? "bg-accent" : "bg-destructive"
    : "bg-muted";

  const timeStr = new Date(audit.created_at).toLocaleString("ar-SA", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const positiveCount = questions.filter(q => {
    const l = q.answer.toLowerCase();
    return l.includes("نعم") || l === "yes" || l === "true" || l.includes("متوفر") || l.includes("ملتزم") || l.includes("نظيف") || l.includes("موجود") || l.includes("مرتب");
  }).length;

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${expanded ? "border-primary/20 bg-card" : "border-border bg-card hover:border-border/80"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4"
      >
        {/* Score circle */}
        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${audit.score !== null ? (audit.score >= 80 ? "border-emerald/40" : audit.score >= 50 ? "border-accent/40" : "border-destructive/40") : "border-border"}`}>
            <span className={`text-sm font-bold font-mono ${scoreColor}`}>
              {audit.score !== null ? audit.score : "—"}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground font-arabic">{storeName}</span>
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeStr}
            </span>
          </div>
          {/* Mini Q&A summary */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-muted-foreground font-arabic">
              {questions.length > 0 ? `${questions.length} سؤال` : "لا توجد أسئلة"}
            </span>
            {questions.length > 0 && (
              <>
                <Minus className="w-3 h-3 text-border" />
                <span className="text-[11px] text-emerald font-arabic">{positiveCount} ✓</span>
                <span className="text-[11px] text-destructive font-arabic">{questions.length - positiveCount} ✗</span>
              </>
            )}
          </div>
        </div>

        {/* Progress bar mini */}
        <div className="w-20 shrink-0 hidden sm:block">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className={`h-full rounded-full ${scoreBarColor} transition-all`} style={{ width: `${audit.score ?? 0}%` }} />
          </div>
        </div>

        <div className="text-muted-foreground shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-4">
              {/* Summary */}
              {audit.summary && (
                <p className="text-sm text-muted-foreground font-arabic leading-relaxed">{audit.summary}</p>
              )}

              {/* All Questions & Answers - Full Width Cards */}
              {questions.length > 0 ? (
                <div className="grid gap-2">
                  {questions.map((q, i) => {
                    const style = getAnswerInfo(q.answer);
                    const Icon = style.icon;
                    return (
                      <div key={i} className={`rounded-lg p-3 ${style.bg} border ${style.border}`}>
                        <div className="flex items-start gap-3">
                          <Icon className={`w-5 h-5 ${style.color} shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-arabic leading-relaxed">{q.question}</p>
                            <p className={`text-sm font-bold font-arabic mt-1 ${style.color}`}>{q.answer}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-xs font-arabic">لا توجد تفاصيل للأسئلة</div>
              )}

              {/* Timestamp footer */}
              <div className="text-[10px] text-muted-foreground font-mono pt-2 border-t border-border/30">
                {new Date(audit.created_at).toLocaleString("ar-SA")}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
