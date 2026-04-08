import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Save, Info, AlertTriangle, Zap, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  storeId: string;
  operatingHours: any;
  subscriptionTier: string;
  onSave?: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MAX_HOURS: Record<string, number> = { basic: 12, pro: 18, enterprise: 24 };

export function OperatingHoursScheduler({ storeId, operatingHours, subscriptionTier, onSave }: Props) {
  const maxHours = MAX_HOURS[subscriptionTier] || 12;
  const [startHour, setStartHour] = useState<number>(operatingHours?.start ?? 8);
  const [endHour, setEndHour] = useState<number>(operatingHours?.end ?? 20);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (operatingHours?.start !== undefined) setStartHour(operatingHours.start);
    if (operatingHours?.end !== undefined) setEndHour(operatingHours.end);
  }, [operatingHours]);

  const selectedHours = endHour > startHour ? endHour - startHour : 24 - startHour + endHour;
  const isOverLimit = selectedHours > maxHours;
  const usagePercent = Math.min((selectedHours / maxHours) * 100, 100);

  const handleSave = async () => {
    if (isOverLimit) {
      toast.error(`عذراً، تجاوزت الحد المسموح لباقة ${subscriptionTier.toUpperCase()}`);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      operating_hours: { start: startHour, end: endHour, max: maxHours, tier: subscriptionTier },
    }).eq("id", storeId);
    
    if (error) {
      toast.error("حدث خطأ أثناء المزامنة");
    } else {
      toast.success("تم تحديث جدول تشغيل الذكاء الاصطناعي");
      onSave?.();
    }
    setSaving(false);
  };

  const formatHour = (h: number) => {
    const period = h >= 12 ? "م" : "ص";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display} ${period}`;
  };

  return (
    <div className="glass-strong rounded-[2.5rem] border border-border p-8 space-y-8 relative overflow-hidden" dir="rtl">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground font-arabic tracking-tight">جدولة الرقابة الذكية</h3>
            <p className="text-xs text-muted-foreground font-arabic">حدد ساعات نشاط المحرك لمتجرك</p>
          </div>
        </div>
        <Badge variant="outline" className={`px-4 py-1.5 rounded-full border-2 font-bold ${isOverLimit ? "border-destructive/50 text-destructive bg-destructive/5" : "border-primary/20 text-primary bg-primary/5"}`}>
          باقة {subscriptionTier === 'basic' ? 'أساسية' : subscriptionTier === 'pro' ? 'احترافية' : 'مؤسسات'}
        </Badge>
      </div>

      {/* Consumption Insights */}
      <div className="space-y-4 bg-secondary/20 p-6 rounded-3xl border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${isOverLimit ? "text-destructive" : "text-primary"}`} />
            <span className="text-sm font-bold text-foreground font-arabic">استهلاك الحصة الزمنية</span>
          </div>
          <span className={`text-lg font-black font-mono ${isOverLimit ? "text-destructive" : "text-primary"}`}>
            {selectedHours} <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest">/ {maxHours} Hours</span>
          </span>
        </div>
        <div className="relative pt-1">
          <Progress value={usagePercent} className={`h-3 rounded-full bg-background border border-border/50 ${isOverLimit ? "[&>div]:bg-destructive" : "[&>div]:bg-primary shadow-[0_0_15px_rgba(163,230,53,0.3)]"}`} />
          {isOverLimit && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-1 left-0 transform -translate-y-full">
              <span className="text-[9px] bg-destructive text-white px-2 py-0.5 rounded-full font-bold">تجاوز الحد</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Time Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-2">Start Time</label>
          <div className="relative group">
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-full bg-secondary/50 border border-border rounded-2xl px-5 py-4 text-sm text-foreground font-bold font-arabic appearance-none focus:border-primary/50 transition-all outline-none"
            >
              {HOURS.map((h) => (
                <option key={h} value={h} className="bg-card">{formatHour(h)}</option>
              ))}
            </select>
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-2">End Time</label>
          <div className="relative group">
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="w-full bg-secondary/50 border border-border rounded-2xl px-5 py-4 text-sm text-foreground font-bold font-arabic appearance-none focus:border-primary/50 transition-all outline-none"
            >
              {HOURS.map((h) => (
                <option key={h} value={h} className="bg-card">{formatHour(h)}</option>
              ))}
            </select>
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>

      {/* Visual Timeline - Interactive Feel */}
      <div className="space-y-3">
        <div className="flex gap-1 h-8 items-end">
          {HOURS.map((h) => {
            const isActive = endHour > startHour
              ? h >= startHour && h < endHour
              : h >= startHour || h < endHour;
            return (
              <motion.div
                key={h}
                initial={false}
                animate={{ 
                  height: isActive ? "100%" : "40%",
                  opacity: isActive ? 1 : 0.3
                }}
                className={`flex-1 rounded-md transition-all duration-300 ${
                  isActive
                    ? isOverLimit ? "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.4)]" : "bg-primary shadow-[0_0_10px_rgba(163,230,53,0.4)]"
                    : "bg-muted/20"
                }`}
                title={formatHour(h)}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono font-bold opacity-40 px-1">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>
      </div>

      {isOverLimit && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex gap-4 rounded-[2rem] bg-destructive/5 border border-destructive/20 p-5 items-center"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-destructive font-arabic">تنبيه: سقف الباقة</p>
            <p className="text-xs text-muted-foreground font-arabic leading-relaxed">
              لقد اخترت {selectedHours} ساعة، بينما تسمح باقتك بـ {maxHours} ساعة فقط. يرجى تقليل المدة أو الترقية.
            </p>
          </div>
        </motion.div>
      )}

      <Button 
        onClick={handleSave} 
        disabled={saving || isOverLimit} 
        className="w-full h-16 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[1.5rem] shadow-xl shadow-primary/20 font-black text-lg transition-all active:scale-[0.98]"
      >
        <Save className="w-5 h-5 me-2" /> 
        {saving ? "جاري مزامنة المحرك..." : "تأكيد جدول التشغيل الآمن"}
      </Button>

      <p className="text-center text-[9px] text-muted-foreground/30 font-mono tracking-[0.2em] uppercase">
        SplitTech Engine Resource Management · Optimized for Saudi Business Hours
      </p>
    </div>
  );
}