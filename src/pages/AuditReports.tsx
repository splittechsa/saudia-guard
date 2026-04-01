import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck, Eye, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Calendar, FileDown
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StoreData {
  id: string;
  name: string;
}

interface AuditLog {
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
  disputed?: boolean;
}

type TimeFilter = "today" | "week" | "month";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `قبل ${hrs} ساعة`;
  return `قبل ${Math.floor(hrs / 24)} يوم`;
}

function extractQA(entry: AuditLog): { question: string; answer: string; positive: boolean }[] {
  const src = entry.observations || entry.result;
  if (!src || typeof src !== "object") return [];
  const pairs: { question: string; answer: string; positive: boolean }[] = [];
  const positiveWords = ["نعم", "yes", "نظيف", "clean", "ممتاز", "جيد", "ملتزم", "موجود", "true"];

  if (Array.isArray(src)) {
    for (const item of src) {
      const q = item.question || item.q || "";
      const a = String(item.answer || item.a || item.result || "");
      if (!q && !a) continue;
      pairs.push({ question: q, answer: a, positive: positiveWords.some(w => a.toLowerCase().includes(w)) });
    }
  } else {
    for (const [k, v] of Object.entries(src)) {
      const a = String(v);
      pairs.push({ question: k, answer: a, positive: positiveWords.some(w => a.toLowerCase().includes(w)) });
    }
  }
  return pairs;
}

function hasFindings(entry: AuditLog): boolean {
  if (extractQA(entry).length > 0) return true;
  return (typeof entry.summary === "string" && entry.summary.trim().length > 0) || entry.score !== null;
}

export default function AuditReports() {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [auditPage, setAuditPage] = useState(0);
  const [hasMoreAudits, setHasMoreAudits] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  const filterStart = useMemo(() => {
    const d = new Date();
    if (timeFilter === "today") d.setHours(0, 0, 0, 0);
    else if (timeFilter === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    return d;
  }, [timeFilter]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const storesRes = await supabase.from("stores").select("id, name").eq("user_id", user.id);
      const storesData = storesRes.data || [];
      setStores(storesData);

      const storeIds = storesData.map(s => s.id);
      if (storeIds.length === 0) { setLoading(false); return; }

      let query = supabase.from("analytics_logs")
        .select("id, store_id, score, status, summary, result, observations, ai_reasoning, confidence_score, created_at, disputed")
        .in("store_id", storeIds)
        .gte("created_at", filterStart.toISOString())
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (storeFilter !== "all") query = query.eq("store_id", storeFilter);

      const { data } = await query;
      setAudits((data || []) as AuditLog[]);
      setHasMoreAudits((data || []).length === PAGE_SIZE);
      setAuditPage(0);
      setLoading(false);
    };
    load();
  }, [user, timeFilter, storeFilter, filterStart]);

  // Realtime
  useEffect(() => {
    if (!user || stores.length === 0) return;
    const storeIds = storeFilter !== "all" ? [storeFilter] : stores.map(s => s.id);
    const channels = storeIds.map(sid =>
      supabase.channel(`audit-page-${sid}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_logs", filter: `store_id=eq.${sid}` }, (payload) => {
          const newEntry = payload.new as AuditLog;
          if (new Date(newEntry.created_at) >= filterStart) {
            setAudits(prev => [newEntry, ...prev]);
          }
        })
        .subscribe()
    );
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [user, stores, storeFilter, filterStart]);

  const loadMore = async () => {
    if (loadingMore || !hasMoreAudits) return;
    setLoadingMore(true);
    const storeIds = storeFilter !== "all" ? [storeFilter] : stores.map(s => s.id);
    const from = (auditPage + 1) * PAGE_SIZE;
    const query = supabase.from("analytics_logs")
      .select("id, store_id, score, status, summary, result, observations, ai_reasoning, confidence_score, created_at, disputed")
      .in("store_id", storeIds)
      .gte("created_at", filterStart.toISOString())
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    const { data } = await query;
    if (data) {
      setAudits(prev => [...prev, ...(data as AuditLog[])]);
      setHasMoreAudits(data.length === PAGE_SIZE);
      setAuditPage(p => p + 1);
    }
    setLoadingMore(false);
  };

  const handleDispute = async (auditId: string) => {
    const { error } = await supabase.from("analytics_logs").update({ disputed: true }).eq("id", auditId);
    if (!error) {
      setAudits(prev => prev.map(a => a.id === auditId ? { ...a, disputed: true } : a));
    }
  };

  const storeNameMap = Object.fromEntries(stores.map(s => [s.id, s.name]));
  const withFindings = useMemo(() => audits.filter(hasFindings), [audits]);

  const timeLabels: Record<TimeFilter, string> = { today: "اليوم", week: "آخر أسبوع", month: "آخر شهر" };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 rounded bg-secondary animate-pulse" />
          <div className="h-48 rounded-xl bg-secondary animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header + Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground font-arabic flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              سجل الجولات
            </h1>
            <p className="text-xs text-muted-foreground font-arabic mt-1">تفاصيل كل جولة تدقيق</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(["today", "week", "month"] as TimeFilter[]).map(t => (
              <Button key={t} size="sm" variant={timeFilter === t ? "default" : "outline"}
                className="text-xs font-arabic" onClick={() => setTimeFilter(t)}>
                {timeLabels[t]}
              </Button>
            ))}
            {stores.length > 1 && (
              <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)}
                className="text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground font-arabic">
                <option value="all">كل المتاجر</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Audit Timeline */}
        {withFindings.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center">
            <Eye className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground font-arabic">لا توجد جولات في هذه الفترة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withFindings.map((audit) => {
              const qa = extractQA(audit);
              const negativeItems = qa.filter(q => !q.positive);
              const isExpanded = expandedAudit === audit.id;
              const storeName = storeNameMap[audit.store_id] || "المتجر";

              return (
                <motion.div key={audit.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl bg-card border border-border p-4 transition-all cursor-pointer hover:border-border/80"
                  onClick={() => setExpandedAudit(isExpanded ? null : audit.id)}>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        negativeItems.length === 0 ? "bg-emerald" :
                        negativeItems.length <= 2 ? "bg-accent" : "bg-destructive"
                      }`} />
                      <div className="min-w-0">
                        <span className="text-xs text-muted-foreground font-arabic">{timeAgo(audit.created_at)} — {storeName}</span>
                        <p className="text-sm text-foreground font-arabic mt-0.5 truncate">
                          {negativeItems.length === 0
                            ? "✅ لا توجد ملاحظات"
                            : `${negativeItems.length} ملاحظة تحتاج انتباه`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      className="mt-4 pt-3 border-t border-border space-y-2">
                      
                      {/* Show summary */}
                      {audit.summary && (
                        <p className="text-sm text-muted-foreground font-arabic leading-relaxed mb-3">{audit.summary}</p>
                      )}

                      {/* Show only negative findings prominently, positives subtly */}
                      {qa.length > 0 && (
                        <div className="space-y-1.5">
                          {qa.filter(q => !q.positive).map((item, i) => (
                            <div key={`neg-${i}`} className="flex items-start gap-2 py-1.5 px-3 rounded-lg bg-destructive/5 border border-destructive/10">
                              <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                              <span className="text-sm text-foreground font-arabic flex-1">{item.question}</span>
                              <span className="text-xs text-destructive font-arabic shrink-0">{item.answer}</span>
                            </div>
                          ))}
                          {qa.filter(q => q.positive).length > 0 && (
                            <p className="text-xs text-emerald font-arabic pt-2 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {qa.filter(q => q.positive).length} بند ملتزم
                            </p>
                          )}
                        </div>
                      )}

                      {audit.ai_reasoning && (
                        <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-xs text-muted-foreground font-arabic">
                            <span className="font-bold text-primary">🤖 تحليل:</span> {audit.ai_reasoning}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        {!audit.disputed && (
                          <Button size="sm" variant="outline" className="text-xs font-arabic border-accent/30 text-accent hover:bg-accent/10"
                            onClick={(e) => { e.stopPropagation(); handleDispute(audit.id); }}>
                            الطعن في هذه النتيجة
                          </Button>
                        )}
                        {audit.disputed && (
                          <span className="text-xs text-accent font-arabic">✓ تم تسجيل الطعن</span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
            {hasMoreAudits && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" className="font-arabic text-xs" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "جاري التحميل..." : "عرض المزيد"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
