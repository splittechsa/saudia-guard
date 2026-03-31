import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AuditLog {
  score: number | null;
  created_at: string;
  result: any;
}

export function ComparativeChart({ audits }: { audits: AuditLog[] }) {
  const data = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 86400000);

    const todayAudits = audits.filter((a) => new Date(a.created_at) >= todayStart && a.score !== null);
    const weekAudits = audits.filter((a) => {
      const d = new Date(a.created_at);
      return d >= weekAgo && d < todayStart && a.score !== null;
    });

    const todayAvg = todayAudits.length > 0 ? Math.round(todayAudits.reduce((s, a) => s + (a.score || 0), 0) / todayAudits.length) : 0;
    const weekAvg = weekAudits.length > 0 ? Math.round(weekAudits.reduce((s, a) => s + (a.score || 0), 0) / weekAudits.length) : 0;

    // Customer count from result.q2
    const todayCustomers = todayAudits.reduce((s, a) => s + (Number(a.result?.q2) || 0), 0);
    const weekDays = Math.max(1, Math.min(7, Math.ceil((todayStart.getTime() - weekAgo.getTime()) / 86400000)));
    const weekAvgCustomers = weekAudits.length > 0 ? Math.round(weekAudits.reduce((s, a) => s + (Number(a.result?.q2) || 0), 0) / weekDays) : 0;

    return { todayAvg, weekAvg, todayCustomers, weekAvgCustomers, todayCount: todayAudits.length, weekCount: weekAudits.length };
  }, [audits]);

  const scoreDiff = data.todayAvg - data.weekAvg;
  const customerDiff = data.weekAvgCustomers > 0 ? Math.round(((data.todayCustomers - data.weekAvgCustomers) / data.weekAvgCustomers) * 100) : 0;

  const chartData = [
    { name: "متوسط النتيجة", اليوم: data.todayAvg, الأسبوع: data.weekAvg },
    { name: "عدد الزبائن", اليوم: data.todayCustomers, الأسبوع: data.weekAvgCustomers },
  ];

  if (data.todayCount === 0 && data.weekCount === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground font-arabic">مقارنة الأداء</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-arabic">اليوم مقابل متوسط الأسبوع</p>
        </div>
        <div className="flex items-center gap-3">
          {scoreDiff !== 0 && (
            <div className={`flex items-center gap-1 text-xs font-mono ${scoreDiff > 0 ? "text-emerald" : "text-destructive"}`}>
              {scoreDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {scoreDiff > 0 ? "+" : ""}{scoreDiff}%
            </div>
          )}
          {customerDiff !== 0 && (
            <div className={`flex items-center gap-1 text-xs font-arabic ${customerDiff > 0 ? "text-emerald" : "text-destructive"}`}>
              زبائن {customerDiff > 0 ? "+" : ""}{customerDiff}%
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barGap={8}>
          <CartesianGrid stroke="hsl(0, 0%, 10%)" strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 3.9%)", border: "1px solid hsl(0, 0%, 10%)", borderRadius: "8px", color: "hsl(0, 0%, 92%)", fontSize: "12px" }} />
          <Bar dataKey="اليوم" fill="hsl(212, 100%, 50%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="الأسبوع" fill="hsl(0, 0%, 25%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
