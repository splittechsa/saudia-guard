import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Users, Target, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ... (نفس الـ Interface السابقة)

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

    // جلب عدد الزبائن من الحقل q2 في النتيجة
    const todayCustomers = todayAudits.reduce((s, a) => s + (Number(a.result?.q2) || 0), 0);
    const weekDays = Math.max(1, Math.min(7, Math.ceil((todayStart.getTime() - weekAgo.getTime()) / 86400000)));
    const weekAvgCustomers = weekAudits.length > 0 ? Math.round(weekAudits.reduce((s, a) => s + (Number(a.result?.q2) || 0), 0) / weekDays) : 0;

    return { todayAvg, weekAvg, todayCustomers, weekAvgCustomers, todayCount: todayAudits.length, weekCount: weekAudits.length };
  }, [audits]);

  const scoreDiff = data.todayAvg - data.weekAvg;
  const customerDiff = data.weekAvgCustomers > 0 ? Math.round(((data.todayCustomers - data.weekAvgCustomers) / data.weekAvgCustomers) * 100) : 0;

  const chartData = [
    { name: "جودة الأداء", اليوم: data.todayAvg, الأسبوع: data.weekAvg },
    { name: "تدفق الزبائن", اليوم: data.todayCustomers, الأسبوع: data.weekAvgCustomers },
  ];

  if (data.todayCount === 0 && data.weekCount === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="glass-strong rounded-[2rem] border border-border p-6 space-y-6 relative overflow-hidden"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Activity className="w-4 h-4 text-primary" />
             <h3 className="text-lg font-black text-foreground font-arabic tracking-tight">مقارنة المؤشرات</h3>
          </div>
          <p className="text-xs text-muted-foreground font-arabic">مقارنة نشاط اليوم مقابل متوسط الـ 7 أيام الماضية</p>
        </div>

        <div className="flex items-center gap-2">
          {/* شارة فرق الدرجات */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black font-mono ${scoreDiff >= 0 ? "bg-emerald/10 text-emerald border-emerald/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
            {scoreDiff > 0 ? <TrendingUp className="w-3 h-3" /> : scoreDiff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {scoreDiff > 0 ? "+" : ""}{scoreDiff}% <span className="font-arabic opacity-60 mr-1">جودة</span>
          </div>
          
          {/* شارة فرق الزبائن */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black font-mono ${customerDiff >= 0 ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/10 text-muted-foreground border-border"}`}>
            <Users className="w-3 h-3" />
            {customerDiff > 0 ? "+" : ""}{customerDiff}% <span className="font-arabic opacity-60 mr-1">زبائن</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[220px] w-full relative group">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={12} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700 }} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis 
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 12 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass-strong border border-white/10 p-3 rounded-xl shadow-2xl">
                      <p className="text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-widest">{payload[0].payload.name}</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-8">
                           <span className="text-xs font-bold text-primary font-arabic">اليوم:</span>
                           <span className="text-xs font-black text-white font-mono">{payload[0].value}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                           <span className="text-xs font-bold text-muted-foreground font-arabic">متوسط الأسبوع:</span>
                           <span className="text-xs font-black text-muted-foreground font-mono">{payload[1].value}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* الأعمدة بتصميم سبلت تيك */}
            <Bar dataKey="اليوم" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={32} />
            <Bar dataKey="الأسبوع" fill="rgba(255,255,255,0.15)" radius={[6, 6, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary Footer */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/50">
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-[10px] font-bold text-foreground/70 font-arabic">أداء اليوم</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <span className="text-[10px] font-bold text-muted-foreground font-arabic">متوسط الأسبوع</span>
         </div>
      </div>

      {/* Decorative Background Icon */}
      <div className="absolute top-0 left-0 p-8 opacity-[0.02] pointer-events-none">
         <Target className="w-32 h-32" />
      </div>
    </motion.div>
  );
}