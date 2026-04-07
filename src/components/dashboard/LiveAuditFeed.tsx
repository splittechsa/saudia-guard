import { useEffect, useState } from "react";
import { Activity, Eye, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface AuditEntry {
  id: string;
  store_id: string;
  score: number | null;
  status: string | null;
  summary: string | null;
  result: any;
  created_at: string;
}

interface Props {
  storeIds: string[];
  storeNameMap: Record<string, string>;
}

export function LiveAuditFeed({ storeIds, storeNameMap }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    if (storeIds.length === 0) return;
    const load = async () => {
      const { data } = await supabase
        .from("analytics_logs")
        .select("id, store_id, score, status, summary, result, created_at")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setEntries(data as AuditEntry[]);
    };
    load();

    const channel = supabase
      .channel("live-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_logs" }, (payload) => {
        const n = payload.new as AuditEntry;
        if (storeIds.includes(n.store_id)) {
          setEntries((prev) => [n, ...prev].slice(0, 10));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [storeIds]);

  const statusColor = (s: string | null) => {
    if (s === "pass") return "text-emerald border-emerald/15 bg-emerald/[0.06]";
    if (s === "warning") return "text-gold border-gold/15 bg-gold/[0.06]";
    return "text-destructive border-destructive/15 bg-destructive/[0.06]";
  };

  const statusLabel = (s: string | null) => {
    if (s === "pass") return "PASS";
    if (s === "warning") return "WARN";
    return "FAIL";
  };

  const extractQuestions = (result: any): { question: string; answer: string }[] => {
    if (!result || typeof result !== "object") return [];
    if (Array.isArray(result)) {
      return result.slice(0, 3).map((item: any) => ({
        question: item.question || item.q || "—",
        answer: item.answer || item.a || item.result || "—",
      }));
    }
    return Object.entries(result).slice(0, 3).map(([k, v]) => ({
      question: k,
      answer: String(v),
    }));
  };

  return (
    <div className="rounded-xl glass p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">البث المباشر للتدقيقات</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald animate-pulse-live" />
          <span className="text-[10px] text-emerald/70 font-mono uppercase tracking-wider">LIVE</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-20" />
          بانتظار بيانات التدقيق...
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {entries.map((entry) => {
            const questions = extractQuestions(entry.result);
            return (
              <div key={entry.id} className="rounded-lg border border-border/15 bg-card/40 p-3 space-y-2 hover:bg-card/60 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground/50 font-mono">
                      [{new Date(entry.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}]
                    </span>
                    <span className="text-[11px] text-foreground/70">{storeNameMap[entry.store_id] || "متجر"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.score !== null && (
                      <span className="text-[11px] font-bold font-mono text-foreground/60">{entry.score}%</span>
                    )}
                    <Badge variant="outline" className={`text-[9px] font-mono ${statusColor(entry.status)}`}>
                      {statusLabel(entry.status)}
                    </Badge>
                  </div>
                </div>
                {questions.length > 0 && (
                  <div className="space-y-1">
                    {questions.map((q, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground/50 truncate max-w-[60%]">{q.question}</span>
                        <span className={`font-semibold font-mono ${
                          q.answer.toLowerCase().includes("نعم") || q.answer.toLowerCase() === "yes" ? "text-emerald" : "text-destructive/70"
                        }`}>{q.answer}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
