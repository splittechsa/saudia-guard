import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

interface AuditLogItemProps {
  storeName: string;
  time: string;
  status: "pass" | "warning" | "fail";
  summary: string;
  score: number;
}

export function AuditLogItem({ storeName, time, status, summary, score }: AuditLogItemProps) {
  const statusConfig = {
    pass: { icon: CheckCircle, color: "text-emerald", bg: "bg-emerald/10" },
    warning: { icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
    fail: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  };

  const { icon: StatusIcon, color, bg } = statusConfig[status];

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/20 transition-all group">
      <div className={`p-2 rounded-lg ${bg}`}>
        <StatusIcon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{storeName}</span>
          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" /> {time}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{summary}</p>
      </div>
      <div className="text-right">
        <span className={`text-lg font-bold font-mono ${color}`}>{score}%</span>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</p>
      </div>
    </div>
  );
}
