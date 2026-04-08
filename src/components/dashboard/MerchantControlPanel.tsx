import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Power, MessageCircle, Clock, Gauge, Info, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  store: {
    id: string;
    name: string;
    is_active: boolean | null;
    whatsapp_enabled?: boolean;
    operating_hours: any;
  };
  subscriptionTier: string;
  onUpdate?: () => void;
}

const MAX_HOURS: Record<string, number> = { basic: 12, pro: 18, enterprise: 24 };
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function MerchantControlPanel({ store, subscriptionTier, onUpdate }: Props) {
  const maxHours = MAX_HOURS[subscriptionTier] || 12;
  const [isActive, setIsActive] = useState(store.is_active ?? false);
  const [whatsappEnabled, setWhatsappEnabled] = useState((store as any).whatsapp_enabled ?? false);
  const [startHour, setStartHour] = useState<number>(store.operating_hours?.start ?? 8);
  const [endHour, setEndHour] = useState<number>(store.operating_hours?.end ?? 20);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsActive(store.is_active ?? false);
    setWhatsappEnabled((store as any).whatsapp_enabled ?? false);
    if (store.operating_hours?.start !== undefined) setStartHour(store.operating_hours.start);
    if (store.operating_hours?.end !== undefined) setEndHour(store.operating_hours.end);
  }, [store]);

  const selectedHours = endHour > startHour ? endHour - startHour : 24 - startHour + endHour;
  const isOverLimit = selectedHours > maxHours;
  const usagePercent = Math.min((selectedHours / maxHours) * 100, 100);

  const formatHour = (h: number) => {
    const period = h >= 12 ? "م" : "ص";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display} ${period}`;
  };

  const handleToggle = async (field: string, value: boolean) => {
    setSaving(true);
    const update: any = { [field]: value };
    if (field === "is_active" && value) {
      update.operating_hours = { start: startHour, end: endHour, max: maxHours, tier: subscriptionTier };
    }
    const { error } = await supabase.from("stores").update(update).eq("id", store.id);
    
    if (error) {
      toast.error("فشل التحديث الفني");
    } else {
      if (field === "is_active") setIsActive(value);
      if (field === "whatsapp_enabled") setWhatsappEnabled(value);
      toast.success(value ? "تم تشغيل النظام بنجاح" : "تم إيقاف التشغيل مؤقتاً");
      onUpdate?.();
    }
    setSaving(false);
  };

  const handleSaveSchedule = async () => {
    if (isOverLimit) {
      toast.error(`تجاوزت الحد المسموح لباقة ${subscriptionTier.toUpperCase()}`);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      operating_hours: { start: startHour, end: endHour, max: maxHours, tier: subscriptionTier },
    }).eq("id", store.id);
    
    if (error) toast.error("خطأ في حفظ الجدول");
    else { toast.success("تم تحديث جدول التشغيل الآمن"); onUpdate?.(); }
    setSaving(false);
  };

  return (
    <div className="glass-strong rounded-[2rem] border border-border p-6 space-y-6 relative overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground font-arabic tracking-tight">قمرة تحكم المتجر</h3>
            <p className="text-[10px] text-muted-foreground font-arabic uppercase tracking-widest">Active Store Management</p>
          </div>
        </div>
        <Badge variant="outline" className="px-3 py-1 rounded-lg border-primary/20 bg-primary/5 text-primary font-bold font-arabic">
          {store.name}
        </Badge>
      </div>

      {/* Master Toggle Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center justify-between rounded-2xl bg-secondary/30 border border-border/50 p-4 transition-all hover:border-emerald/30">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isActive ? "bg-emerald/10 text-emerald" : "bg-muted text-muted-foreground"}`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground font-arabic">التدقيق الذكي</p>
              <p className="text-[10px] text-muted-foreground font-arabic">AI Engine State</p>
            </div>
          </div>
          <Switch checked={isActive} onCheckedChange={(v) => handleToggle("is_active", v)} disabled={saving} />
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center justify-between rounded-2xl bg-secondary/30 border border-border/50 p-4 transition-all hover:border-primary/30">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${whatsappEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground font-arabic">تقارير واتساب</p>
              <p className="text-[10px] text-muted-foreground font-arabic">Live Feed Updates</p>
            </div>
          </div>
          <Switch checked={whatsappEnabled} onCheckedChange={(v) => handleToggle("whatsapp_enabled", v)} disabled={saving} />
        </motion.div>
      </div>

      {/* Quota Section */}
      <div className="space-y-3 bg-secondary/20 p-5 rounded-2xl border border-border/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Zap className={`w-3.5 h-3.5 ${isOverLimit ? "text-destructive" : "text-primary"}`} />
            <span className="font-bold text-foreground font-arabic">حصة التشغيل اليومية</span>
          </div>
          <span className={`font-mono font-black ${isOverLimit ? "text-destructive" : "text-emerald"}`}>
            {selectedHours} <span className="text-[10px] opacity-40">/ {maxHours}H</span>
          </span>
        </div>
        <Progress value={usagePercent} className={`h-2 rounded-full ${isOverLimit ? "[&>div]:bg-destructive" : "[&>div]:bg-primary shadow-[0_0_10px_rgba(163,230,53,0.2)]"}`} />
        <p className="text-[9px] text-muted-foreground font-arabic text-center italic">
          باقة {subscriptionTier === "basic" ? "أساسية" : subscriptionTier === "pro" ? "احترافية" : "مؤسسات"} · الحد المسموح: {maxHours} ساعة
        </p>
      </div>

      {/* Scheduling Area */}
      <div className="space-y-4 border-t border-border/50 pt-6">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-black text-foreground font-arabic uppercase tracking-tighter">جدولة ساعات الرقابة</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground mr-1">بداية البث</label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-bold font-arabic outline-none focus:border-primary/50 transition-all"
            >
              {HOURS.map((h) => <option key={h} value={h} className="bg-card">{formatHour(h)}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground mr-1">نهاية البث</label>
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-bold font-arabic outline-none focus:border-primary/50 transition-all"
            >
              {HOURS.map((h) => <option key={h} value={h} className="bg-card">{formatHour(h)}</option>)}
            </select>
          </div>
        </div>

        {/* Dynamic Timeline Bar */}
        <div className="space-y-2">
          <div className="flex gap-0.5 h-4 items-end">
            {HOURS.map((h) => {
              const isActiveHour = endHour > startHour ? h >= startHour && h < endHour : h >= startHour || h < endHour;
              return (
                <div
                  key={h}
                  className={`flex-1 rounded-sm transition-all duration-300 ${
                    isActiveHour
                      ? isOverLimit ? "bg-destructive/40 h-full" : "bg-primary/50 h-full"
                      : "bg-muted/10 h-2/3"
                  }`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] text-muted-foreground font-mono font-bold opacity-50 px-0.5">
            <span>12A</span><span>6A</span><span>12P</span><span>6P</span><span>12A</span>
          </div>
        </div>

        {/* Warning Badge */}
        {isOverLimit && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-[10px] text-destructive font-arabic leading-relaxed font-bold">
              تجاوزت سقف الباقة ({maxHours} ساعة). يرجى الترقية أو تقليص المدة.
            </p>
          </motion.div>
        )}

        <Button
          onClick={handleSaveSchedule}
          disabled={saving || isOverLimit}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black font-arabic text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {saving ? "جاري المزامنة..." : "تأكيد وتحديث الجدول الآمن"}
        </Button>
      </div>

      {/* Decorative Background Icon */}
      <div className="absolute -bottom-6 -left-6 p-4 opacity-[0.02] pointer-events-none">
        <CheckCircle2 className="w-24 h-24" />
      </div>
    </div>
  );
}