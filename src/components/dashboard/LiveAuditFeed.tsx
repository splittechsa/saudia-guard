import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Eye, Clock, ShieldCheck, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// ... (نفس الـ Interfaces السابقة)

export function LiveAuditFeed({ storeIds, storeNameMap }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    if (storeIds.length === 0) return;
    
    const loadInitial = async () => {
      const { data } = await supabase
        .from("analytics_logs")
        .select("id, store_id, score, status, summary, result, created_at")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setEntries(data as AuditEntry[]);
    };
    loadInitial();

    const channel = supabase
      .channel("live-audit-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_logs" }, (payload) => {
        const n = payload.new as AuditEntry;
        if (storeIds.includes(n.store_id)) {
          setEntries((prev) => [n, ...prev].slice(0, 10));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [storeIds]);

  const getStatusTheme = (s: string | null) => {
    if (s === "pass") return "text-emerald border-emerald/20 bg-emerald/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
    if (s === "warning") return "text-orange-400 border-orange-400/20 bg-orange-400/10 shadow-[0_0_10px_rgba(251,146,60,0.1)]";
    return "text-destructive border-destructive/20 bg-destructive/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]";
  };

  const extractQuestions = (result: any) => {
    if (!result) return [];
    const raw = Array.isArray(result) ? result : Object.entries(result).map(([q, a]) => ({ question: q, answer: a }));
    return raw.slice(0, 3).map((item: any) => ({
      q: item.question || item.q || "—",
      a: String(item.answer || item.a || item.result || "—")
    }));
  };

  return (
    <div className="glass-strong rounded-[2rem] border border-border p-6 space-y-6 relative overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary animate-pulse">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground font-arabic tracking-tight">بث التدقيق اللحظي</h3>
            <p className="text-[10px] text-muted-foreground font-arabic uppercase tracking-widest">Live Engine Feed</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald/5 border border-emerald/20 px-3 py-1 rounded-full">
           <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-ping" />
           <span className="text-[10px] font-black text-emerald font-mono">ST-STREAMING</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1 relative z-10">
        <AnimatePresence initial={false}>
          {entries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-3 opacity-20">
              <Eye className="w-12 h-12 mx-auto" />
              <p className="text-sm font-bold font-arabic">بانتظار البيانات من الكاميرات...</p>
            </motion.div>
          ) : (
            entries.map((entry, idx) => {
              const questions = extractQuestions(entry.result);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="group rounded-2xl border border-border/50 bg-secondary/20 p-4 transition-all hover:bg-secondary/40 hover:border-primary/20"
                >
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                      <span className="text-[11px] font-black text-primary/70 font-mono">
                        {new Date(entry.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <span className="text-[11px] font-bold text-foreground/80 font-arabic border-r border-border/50 pr-2">
                        {storeNameMap[entry.store_id] || "المتجر الرئيسي"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {entry.score !== null && (
                        <span className="text-xs font-black font-mono text-foreground">{entry.score}%</span>
                      )}
                      <Badge variant="outline" className={`text-[9px] font-black px-2 py-0 border-none rounded-lg ${getStatusTheme(entry.status)}`}>
                        {entry.status?.toUpperCase() || "AUDIT"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {questions.map((item, i) => {
                      const isPositive = item.a.toLowerCase().includes("نعم") || item.a.toLowerCase().includes("yes");
                      return (
                        <div key={i} className="flex items-center justify-between bg-background/40 p-2 rounded-xl border border-border/20 group-hover:border-primary/10 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                            <p className="text-[11px] text-muted-foreground font-arabic truncate">{item.q}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {isPositive ? <CheckCircle2 className="w-3 h-3 text-emerald" /> : <AlertCircle className="w-3 h-3 text-destructive" />}
                            <span className={`text-[11px] font-black font-arabic ${isPositive ? "text-emerald" : "text-destructive/80"}`}>
                              {item.a}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Decorative Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
    </div>
  );
}