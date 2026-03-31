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
    if (s === "pass") return "text-emerald border-emerald/30";
    if (s === "warning") return "text-accent border-accent/30";
    return "text-destructive border-destructive/30";
  };

  const statusLabel = (s: string | null) => {
    if (s === "pass") return "ناجح";
    if (s === "warning") return "تحذير";
    return "فشل";
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
    <div className="rounded-xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground font-arabic">البث المباشر للتدقيقات</h3>
        </div>
        <span className="text-[10px] text-emerald font-mono uppercase tracking-wider animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald" /> LIVE
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm font-arabic">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
          بانتظار بيانات التدقيق...
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {entries.map((entry) => {
            const questions = extractQuestions(entry.result);
            return (
              <div key={entry.id} className="rounded-lg bg-secondary/30 border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(entry.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[11px] text-foreground font-arabic">{storeNameMap[entry.store_id] || "متجر"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.score !== null && (
                      <span className="text-xs font-bold font-mono text-foreground">{entry.score}%</span>
                    )}
                    <Badge variant="outline" className={`text-[9px] ${statusColor(entry.status)}`}>
                      {statusLabel(entry.status)}
                    </Badge>
                  </div>
                </div>
                {questions.length > 0 && (
                  <div className="space-y-1">
                    {questions.map((q, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-arabic truncate max-w-[60%]">{q.question}</span>
                        <span className={`font-arabic font-semibold ${
                          q.answer.toLowerCase().includes("نعم") || q.answer.toLowerCase() === "yes" ? "text-emerald" : "text-destructive"
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
