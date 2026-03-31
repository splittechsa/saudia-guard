import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Download, Filter, Calendar, TrendingUp, AlertTriangle, CheckCircle, BarChart3, FileText, FileDown } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AuditLog {
  id: string;
  store_id: string;
  score: number | null;
  status: string | null;
  summary: string | null;
  result: any;
  created_at: string;
}

interface StoreData {
  id: string;
  name: string;
}

const DATE_RANGES = [
  { label: "اليوم", value: "today" },
  { label: "آخر 7 أيام", value: "7days" },
  { label: "آخر 30 يوم", value: "30days" },
  { label: "آخر 90 يوم", value: "90days" },
];

export default function Reports() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [dateRange, setDateRange] = useState("7days");
  const [selectedStore, setSelectedStore] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [storesRes, auditsRes] = await Promise.all([
        supabase.from("stores").select("id, name").eq("user_id", user.id),
        supabase.from("analytics_logs").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      if (storesRes.data) setStores(storesRes.data);
      if (auditsRes.data) setAudits(auditsRes.data as AuditLog[]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const getDateThreshold = () => {
    const now = new Date();
    switch (dateRange) {
      case "today": return new Date(now.setHours(0, 0, 0, 0));
      case "7days": return new Date(now.setDate(now.getDate() - 7));
      case "30days": return new Date(now.setDate(now.getDate() - 30));
      case "90days": return new Date(now.setDate(now.getDate() - 90));
      default: return new Date(now.setDate(now.getDate() - 7));
    }
  };

  const filtered = useMemo(() => {
    const threshold = getDateThreshold();
    return audits.filter((a) => {
      const dateOk = new Date(a.created_at) >= threshold;
      const storeOk = selectedStore === "all" || a.store_id === selectedStore;
      const statusOk = statusFilter === "all" || a.status === statusFilter;
      return dateOk && storeOk && statusOk;
    });
  }, [audits, dateRange, selectedStore, statusFilter]);

  const storeNameMap = Object.fromEntries(stores.map((s) => [s.id, s.name]));

  const stats = useMemo(() => {
    const total = filtered.length;
    const passed = filtered.filter((a) => a.status === "pass").length;
    const warnings = filtered.filter((a) => a.status === "warning").length;
    const failed = filtered.filter((a) => a.status === "fail").length;
    const avg = total > 0 ? Math.round(filtered.reduce((s, a) => s + (a.score || 0), 0) / total) : 0;
    return { total, passed, warnings, failed, avg };
  }, [filtered]);

  const chartData = useMemo(() => {
    const scored = [...filtered].filter((a) => a.score !== null).reverse();
    const grouped: Record<string, { scores: number[]; count: number }> = {};
    scored.forEach((a) => {
      const day = new Date(a.created_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
      if (!grouped[day]) grouped[day] = { scores: [], count: 0 };
      grouped[day].scores.push(a.score || 0);
      grouped[day].count++;
    });
    return Object.entries(grouped).map(([day, data]) => ({
      day,
      avg: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      count: data.count,
    }));
  }, [filtered]);

  const statusPieData = [
    { name: "ناجح", value: stats.passed, color: "hsl(160, 84%, 39%)" },
    { name: "تحذير", value: stats.warnings, color: "hsl(43, 76%, 53%)" },
    { name: "فشل", value: stats.failed, color: "hsl(0, 84%, 60%)" },
  ].filter((d) => d.value > 0);

  const exportCSV = () => {
    // Extract all unique keys from JSONB result fields
    const resultKeys = new Set<string>();
    filtered.forEach((a) => {
      if (a.result && typeof a.result === "object" && !Array.isArray(a.result)) {
        Object.keys(a.result).forEach((k) => resultKeys.add(k));
      }
    });
    const sortedResultKeys = Array.from(resultKeys).sort();

    const headers = ["التاريخ", "المتجر", "الحالة", "النتيجة", "الملخص", ...sortedResultKeys];
    const rows = filtered.map((a) => {
      const resultValues = sortedResultKeys.map((k) => {
        const val = a.result?.[k];
        return val !== undefined && val !== null ? String(val) : "";
      });
      return [
        new Date(a.created_at).toLocaleString("ar-SA"),
        storeNameMap[a.store_id] || a.store_id,
        a.status || "",
        String(a.score || ""),
        a.summary || "",
        ...resultValues,
      ];
    });
    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Header
    doc.setFillColor(2, 2, 2);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Split Intelligence", 105, 18, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text("Audit Report", 105, 28, { align: "center" });

    // Stats
    doc.setTextColor(0, 0, 0);
    let y = 50;
    doc.setFontSize(11);
    doc.text(`Total Audits: ${stats.total}`, 20, y);
    doc.text(`Passed: ${stats.passed}`, 80, y);
    doc.text(`Warnings: ${stats.warnings}`, 120, y);
    doc.text(`Failed: ${stats.failed}`, 160, y);
    y += 8;
    doc.text(`Average Score: ${stats.avg}%`, 20, y);
    doc.text(`Date: ${new Date().toLocaleDateString("en-SA")}`, 120, y);
    y += 12;

    // Table header
    doc.setFillColor(10, 10, 10);
    doc.rect(15, y, 180, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("Date", 18, y + 5.5);
    doc.text("Store", 55, y + 5.5);
    doc.text("Status", 100, y + 5.5);
    doc.text("Score", 130, y + 5.5);
    doc.text("Summary", 150, y + 5.5);
    y += 10;

    // Table rows
    doc.setTextColor(0, 0, 0);
    filtered.slice(0, 40).forEach((audit) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.setFontSize(7);
      doc.text(new Date(audit.created_at).toLocaleString("en-SA").slice(0, 16), 18, y);
      doc.text((storeNameMap[audit.store_id] || "-").slice(0, 20), 55, y);
      doc.text(audit.status || "-", 100, y);
      doc.text(String(audit.score ?? "-"), 130, y);
      doc.text((audit.summary || "-").slice(0, 25), 150, y);
      y += 5;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Powered by Split Intelligence | splittechsa.com", 105, 290, { align: "center" });

    doc.save(`split-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-arabic">التقارير والتحليلات</h1>
            <p className="text-sm text-muted-foreground mt-1 font-arabic">تحليل شامل لنتائج التدقيق التشغيلي</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="outline" className="border-emerald/30 text-emerald hover:bg-emerald/10 font-arabic">
              <Download className="w-4 h-4 me-2" /> تصدير CSV
            </Button>
            <Button onClick={exportPDF} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 font-arabic">
              <FileDown className="w-4 h-4 me-2" /> تصدير PDF
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <Calendar className="w-4 h-4 me-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-[180px] bg-card border-border">
              <Filter className="w-4 h-4 me-2 text-muted-foreground" />
              <SelectValue placeholder="جميع المتاجر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المتاجر</SelectItem>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-card border-border">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pass">ناجح</SelectItem>
              <SelectItem value="warning">تحذير</SelectItem>
              <SelectItem value="fail">فشل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-arabic">إجمالي التدقيقات</span>
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald" />
              <span className="text-xs text-muted-foreground font-arabic">ناجح</span>
            </div>
            <p className="text-2xl font-bold text-emerald font-mono">{stats.passed}</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground font-arabic">تحذيرات</span>
            </div>
            <p className="text-2xl font-bold text-accent font-mono">{stats.warnings}</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-arabic">متوسط النتيجة</span>
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">{stats.avg}%</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-xl bg-card border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 font-arabic">مؤشر الأداء اليومي</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(212, 100%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(212, 100%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(0, 0%, 10%)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 3.9%)", border: "1px solid hsl(0, 0%, 10%)", borderRadius: "8px", color: "hsl(0, 0%, 92%)", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="avg" stroke="hsl(212, 100%, 50%)" fill="url(#avgGrad)" strokeWidth={2} name="متوسط النتيجة" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm font-arabic">لا توجد بيانات للفترة المحددة</div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl bg-card border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 font-arabic">توزيع الحالات</h3>
            {statusPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {statusPieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] text-muted-foreground font-arabic">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm font-arabic">لا توجد بيانات</div>
            )}
          </motion.div>
        </div>

        {/* Audit Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground font-arabic">سجل التدقيقات التفصيلي</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right p-3 text-xs text-muted-foreground font-arabic font-medium">التاريخ</th>
                  <th className="text-right p-3 text-xs text-muted-foreground font-arabic font-medium">المتجر</th>
                  <th className="text-right p-3 text-xs text-muted-foreground font-arabic font-medium">الحالة</th>
                  <th className="text-right p-3 text-xs text-muted-foreground font-arabic font-medium">النتيجة</th>
                  <th className="text-right p-3 text-xs text-muted-foreground font-arabic font-medium">الملخص</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((audit) => (
                  <tr key={audit.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-3 text-xs text-muted-foreground font-mono">{new Date(audit.created_at).toLocaleString("ar-SA")}</td>
                    <td className="p-3 text-xs text-foreground font-arabic">{storeNameMap[audit.store_id] || "—"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[10px] ${
                        audit.status === "pass" ? "text-emerald border-emerald/30" : audit.status === "warning" ? "text-accent border-accent/30" : "text-destructive border-destructive/30"
                      }`}>
                        {audit.status === "pass" ? "ناجح" : audit.status === "warning" ? "تحذير" : "فشل"}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs font-mono text-foreground">{audit.score !== null ? `${audit.score}%` : "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground font-arabic max-w-[200px] truncate">{audit.summary || "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm font-arabic">لا توجد تدقيقات للفترة والفلاتر المحددة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
