import { CheckCircle, AlertTriangle, XCircle, Clock, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuditLogItemProps {
  id?: string;
  storeName: string;
  time: string;
  status: "pass" | "warning" | "fail";
  summary: string;
  score: number;
  disputed?: boolean;
  onDispute?: (id: string) => void;
}

export function AuditLogItem({ id, storeName, time, status, summary, score, disputed, onDispute }: AuditLogItemProps) {
  const statusConfig = {
    pass: { icon: CheckCircle, color: "text-emerald", bg: "bg-emerald/10" },
    warning: { icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
    fail: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  };

  const { icon: StatusIcon, color, bg } = statusConfig[status];

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg bg-card border hover:border-primary/20 transition-all group ${disputed ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
      <div className={`p-2 rounded-lg ${bg}`}>
        <StatusIcon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{storeName}</span>
          {disputed && <Badge variant="destructive" className="text-[8px]">طعن</Badge>}
          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" /> {time}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{summary}</p>
      </div>
      <div className="text-right flex items-center gap-3">
        <div>
          <span className={`text-lg font-bold font-mono ${color}`}>{score}%</span>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</p>
        </div>
        {onDispute && id && !disputed && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); onDispute(id); }}
            className="h-7 px-2 text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity font-arabic"
            title="طعن في النتيجة"
          >
            <Flag className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
