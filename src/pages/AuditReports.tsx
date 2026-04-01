import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck, Eye, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Filter, Calendar, AlertTriangle, Lightbulb
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/ui/stat-card";
import { StatCardSkeleton } from "@/components/ui/carbon-skeleton";

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

// Generate actionable recommendation based on failure pattern
function getRecommendation(question: string, count: number, total: number): string {
  const rate = Math.round((count / total) * 100);
  if (rate >= 80) return `⚠️ مشكلة مزمنة — يجب معالجتها فوراً قبل بداية الوردية القادمة`;
  if (rate >= 50) return `📋 تكررت في أكثر من نصف الجولات — أضف هذا البند لقائمة المراجعة اليومية`;
  return `💡 ملاحظة عرضية — تابعها خلال الأيام القادمة`;
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
    let query = supabase.from("analytics_logs")
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

  // Stats
  const avgScore = useMemo(() => {
    const scored = withFindings.filter(a => a.score !== null);
    return scored.length > 0 ? Math.round(scored.reduce((s, a) => s + (a.score || 0), 0) / scored.length) : 0;
  }, [withFindings]);

  const passRate = useMemo(() => {
    const scored = withFindings.filter(a => a.score !== null);
    if (scored.length === 0) return 0;
    return Math.round((scored.filter(a => (a.score || 0) >= 80).length / scored.length) * 100);
  }, [withFindings]);

  // Top failures with recommendations
  const topFailures = useMemo(() => {
    const failCounts: Record<string, number> = {};
    let totalAudits = 0;
    for (const a of withFindings) {
      const qa = extractQA(a);
      if (qa.length > 0) totalAudits++;
      for (const { question, positive } of qa) {
        if (!positive && question) failCounts[question] = (failCounts[question] || 0) + 1;
      }
    }
    return Object.entries(failCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question, count]) => ({
        question, count, total: totalAudits,
        recommendation: getRecommendation(question, count, totalAudits),
      }));
  }, [withFindings]);

  const timeLabels: Record<TimeFilter, string> = { today: "اليوم", week: "آخر أسبوع", month: "آخر شهر" };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 rounded bg-secondary animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
          </div>
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
              تقارير التدقيق
            </h1>
            <p className="text-xs text-muted-foreground font-arabic mt-1">جميع جولات التدقيق مع تحليل الأداء والتوصيات</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time filter */}
            {(["today", "week", "month"] as TimeFilter[]).map(t => (
              <Button key={t} size="sm" variant={timeFilter === t ? "default" : "outline"}
                className="text-xs font-arabic" onClick={() => setTimeFilter(t)}>
                {timeLabels[t]}
              </Button>
            ))}
            {/* Store filter */}
            {stores.length > 1 && (
              <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)}
                className="text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground font-arabic">
                <option value="all">كل المتاجر</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={Eye} label="عدد الجولات" value={String(withFindings.length)} numericValue={withFindings.length}
            change={`${timeLabels[timeFilter]}`} changeType="neutral" glowColor="blue" />
          <StatCard icon={TrendingUp} label="متوسط الانضباط" value={avgScore > 0 ? `${avgScore}%` : "--"}
            numericValue={avgScore > 0 ? avgScore : undefined}
            change={avgScore >= 80 ? "أداء ممتاز" : avgScore > 0 ? "يحتاج تحسين" : "لا توجد بيانات"}
            changeType={avgScore >= 80 ? "positive" : avgScore > 0 ? "negative" : "neutral"} glowColor={avgScore >= 80 ? "emerald" : "gold"} />
          <StatCard icon={CheckCircle2} label="نسبة النجاح" value={passRate > 0 ? `${passRate}%` : "--"}
            numericValue={passRate > 0 ? passRate : undefined}
            change={`جولات حققت 80%+`} changeType={passRate >= 70 ? "positive" : "negative"} glowColor="emerald" />
        </div>

        {/* Top Failures with Recommendations */}
        {topFailures.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-card border border-border p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-foreground font-arabic">أبرز الملاحظات والتوصيات</h3>
            </div>
            {topFailures.map((f, i) => (
              <div key={i} className="rounded-lg bg-secondary/30 border border-border p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-arabic text-foreground font-semibold">{f.question}</span>
                  <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                    {f.count} من {f.total} جولة
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-arabic">{f.recommendation}</p>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-destructive/60 transition-all" style={{ width: `${Math.round((f.count / f.total) * 100)}%` }} />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Audit Timeline */}
        <div>
          <h2 className="text-lg font-bold text-foreground font-arabic mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            الخط الزمني للجولات
          </h2>

          {withFindings.length === 0 ? (
            <div className="rounded-xl bg-card border border-border p-8 text-center">
              <Eye className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground font-arabic">لا توجد جولات في هذه الفترة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withFindings.map((audit) => {
                const qa = extractQA(audit);
                const positiveCount = qa.filter(q => q.positive).length;
                const negativeCount = qa.filter(q => !q.positive).length;
                const isExpanded = expandedAudit === audit.id;
                const storeName = storeNameMap[audit.store_id] || "المتجر";

                return (
                  <motion.div key={audit.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${
                      (audit.score || 0) >= 80 ? "bg-emerald/5 border-emerald/20" :
                      (audit.score || 0) >= 50 ? "bg-accent/5 border-accent/20" :
                      "bg-destructive/5 border-destructive/20"
                    }`}
                    onClick={() => setExpandedAudit(isExpanded ? null : audit.id)}>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${
                          (audit.score || 0) >= 80 ? "bg-emerald" :
                          (audit.score || 0) >= 50 ? "bg-accent" : "bg-destructive"
                        }`} />
                        <div>
                          <span className="text-xs text-muted-foreground font-arabic">{timeAgo(audit.created_at)} — {storeName}</span>
                          <p className="text-sm font-semibold text-foreground font-arabic mt-0.5">
                            {audit.summary || (negativeCount > 0 ? `تم رصد ${negativeCount} ملاحظة` : "العمليات ممتازة")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {audit.score !== null && (
                          <span className={`text-lg font-bold font-mono ${
                            audit.score >= 80 ? "text-emerald" :
                            audit.score >= 50 ? "text-accent" : "text-destructive"
                          }`}>{audit.score}%</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {positiveCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {positiveCount} إيجابي
                        </span>
                      )}
                      {negativeCount > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="w-3.5 h-3.5" /> {negativeCount} سلبي
                        </span>
                      )}
                    </div>

                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        className="mt-4 pt-3 border-t border-border space-y-2">
                        {qa.map((item, i) => (
                          <div key={i} className="flex items-start justify-between gap-2 py-1.5">
                            <span className="text-sm text-muted-foreground font-arabic flex-1">{item.question}</span>
                            <span className={`text-sm font-bold font-arabic shrink-0 flex items-center gap-1 ${item.positive ? "text-emerald" : "text-destructive"}`}>
                              {item.positive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {item.answer}
                            </span>
                          </div>
                        ))}
                        {audit.ai_reasoning && (
                          <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-xs text-muted-foreground font-arabic">
                              <span className="font-bold text-primary">🤖 تحليل الذكاء الاصطناعي:</span> {audit.ai_reasoning}
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
      </div>
    </DashboardLayout>
  );
}
