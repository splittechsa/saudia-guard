import { useState } from "react";
import { ChevronDown, ChevronUp, Brain, ShieldCheck, AlertTriangle, XCircle, CheckCircle, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  const statusConfig = {
    pass: { icon: CheckCircle, color: "text-emerald", bg: "bg-emerald/10", border: "border-emerald/20", label: "ناجح" },
    warning: { icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", label: "تحذير" },
    fail: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "فشل" },
  };

  const cfg = statusConfig[(audit.status as keyof typeof statusConfig)] || statusConfig.fail;
  const StatusIcon = cfg.icon;

  // Extract Q&A from observations or result
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

  const getAnswerStyle = (answer: string) => {
    const lower = answer.toLowerCase();
    if (lower.includes("نعم") || lower === "yes" || lower === "true" || lower.includes("متوفر") || lower.includes("ملتزم") || lower.includes("نظيف") || lower.includes("موجود")) {
      return { color: "text-emerald", icon: CheckCircle, bg: "bg-emerald/10" };
    }
    if (lower.includes("لا") || lower === "no" || lower === "false" || lower.includes("غير") || lower.includes("مخالف") || lower.includes("متسخ")) {
      return { color: "text-destructive", icon: XCircle, bg: "bg-destructive/10" };
    }
    return { color: "text-accent", icon: AlertTriangle, bg: "bg-accent/10" };
  };

  return (
    <div className={`rounded-xl border transition-all duration-200 ${expanded ? `${cfg.border} bg-secondary/20` : "border-border bg-card hover:border-primary/20"}`}>
      {/* Header Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-right"
      >
        <div className={`p-2 rounded-lg ${cfg.bg} shrink-0`}>
          <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
        </div>

        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground font-arabic">{storeName}</span>
            <Badge variant="outline" className={`text-[9px] ${cfg.color} ${cfg.border}`}>
              {cfg.label}
            </Badge>
            {audit.confidence_score !== null && (
              <span className="text-[10px] text-muted-foreground font-mono">ثقة: {audit.confidence_score}%</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-arabic truncate">{audit.summary || "لا يوجد ملخص"}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-left">
            {audit.score !== null && (
              <span className={`text-lg font-bold font-mono ${cfg.color}`}>{audit.score}%</span>
            )}
            <p className="text-[10px] text-muted-foreground font-mono">
              {new Date(audit.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="text-muted-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
              {/* Questions & Answers */}
              {questions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-semibold text-foreground font-arabic">نتائج الأسئلة ({questions.length})</h4>
                  </div>
                  <div className="grid gap-2">
                    {questions.map((q, i) => {
                      const style = getAnswerStyle(q.answer);
                      const AnswerIcon = style.icon;
                      return (
                        <div key={i} className={`flex items-start gap-3 rounded-lg p-3 ${style.bg} border ${style.color.replace("text-", "border-")}/10`}>
                          <div className="shrink-0 mt-0.5">
                            <AnswerIcon className={`w-4 h-4 ${style.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground font-arabic font-medium">{q.question}</p>
                            <p className={`text-sm font-semibold font-arabic mt-1 ${style.color}`}>{q.answer}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Reasoning */}
              {audit.ai_reasoning && (
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-semibold text-foreground font-arabic">تحليل الذكاء الاصطناعي</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{audit.ai_reasoning}</p>
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono pt-2 border-t border-border/30">
                <span>التاريخ: {new Date(audit.created_at).toLocaleString("ar-SA")}</span>
                {audit.confidence_score !== null && <span>نسبة الثقة: {audit.confidence_score}%</span>}
                <span>ID: {audit.id.slice(0, 8)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
