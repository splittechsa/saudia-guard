import { useState, useEffect } from "react";
import { Power, MessageCircle, Clock, Gauge, Info } from "lucide-react";
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
    if (error) toast.error("فشل التحديث");
    else {
      if (field === "is_active") setIsActive(value);
      if (field === "whatsapp_enabled") setWhatsappEnabled(value);
      toast.success(value ? "تم التفعيل" : "تم الإيقاف");
      onUpdate?.();
    }
    setSaving(false);
  };

  const handleSaveSchedule = async () => {
    if (isOverLimit) {
      toast.error(`تجاوزت الحد الأقصى (${maxHours} ساعة) — قم بترقية الباقة`);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      operating_hours: { start: startHour, end: endHour, max: maxHours, tier: subscriptionTier },
    }).eq("id", store.id);
    if (error) toast.error("فشل حفظ الجدول");
    else { toast.success("تم حفظ جدول التشغيل"); onUpdate?.(); }
    setSaving(false);
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground font-arabic flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" /> مركز تحكم المتجر
        </h3>
        <Badge variant="outline" className="text-[10px] text-accent border-accent/30 font-arabic">
          {store.name}
        </Badge>
      </div>

      {/* Master Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 border border-border p-4">
          <div className="flex items-center gap-3">
            <Power className={`w-5 h-5 ${isActive ? "text-emerald" : "text-muted-foreground"}`} />
            <div>
              <p className="text-sm font-semibold text-foreground font-arabic">التدقيق الذكي</p>
              <p className="text-[10px] text-muted-foreground font-arabic">تشغيل/إيقاف المحرك</p>
            </div>
          </div>
          <Switch checked={isActive} onCheckedChange={(v) => handleToggle("is_active", v)} disabled={saving} />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 border border-border p-4">
          <div className="flex items-center gap-3">
            <MessageCircle className={`w-5 h-5 ${whatsappEnabled ? "text-emerald" : "text-muted-foreground"}`} />
            <div>
              <p className="text-sm font-semibold text-foreground font-arabic">تقارير واتساب</p>
              <p className="text-[10px] text-muted-foreground font-arabic">ملخص يومي تلقائي</p>
            </div>
          </div>
          <Switch checked={whatsappEnabled} onCheckedChange={(v) => handleToggle("whatsapp_enabled", v)} disabled={saving} />
        </div>
      </div>

      {/* Quota Tracker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-arabic">حصة الساعات</span>
          <span className={`font-mono font-bold ${isOverLimit ? "text-destructive" : "text-emerald"}`}>
            {selectedHours}/{maxHours} ساعة
          </span>
        </div>
        <Progress value={usagePercent} className={`h-2.5 ${isOverLimit ? "[&>div]:bg-destructive" : ""}`} />
        <p className="text-[10px] text-muted-foreground font-arabic">
          باقة {subscriptionTier === "basic" ? "أساسي" : subscriptionTier === "pro" ? "احترافي" : "مؤسسي"} — الحد الأقصى {maxHours} ساعة يومياً
        </p>
      </div>

      {/* Time Range Picker */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground font-arabic">جدول التشغيل</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground font-arabic block mb-1">وقت البدء</label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-arabic"
            >
              {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-arabic block mb-1">وقت الانتهاء</label>
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-arabic"
            >
              {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
            </select>
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="flex gap-0.5 h-5">
          {HOURS.map((h) => {
            const isActiveHour = endHour > startHour
              ? h >= startHour && h < endHour
              : h >= startHour || h < endHour;
            return (
              <div
                key={h}
                className={`flex-1 rounded-sm transition-colors ${
                  isActiveHour
                    ? isOverLimit ? "bg-destructive/60" : "bg-primary/60"
                    : "bg-secondary/50"
                }`}
                title={formatHour(h)}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
          <span>12 ص</span><span>6 ص</span><span>12 م</span><span>6 م</span><span>12 ص</span>
        </div>

        {isOverLimit && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3">
            <Info className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive font-arabic">
              تجاوزت الحد الأقصى ({maxHours} ساعة). قلل الساعات أو قم بترقية الباقة.
            </p>
          </div>
        )}

        <button
          onClick={handleSaveSchedule}
          disabled={saving || isOverLimit}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-arabic font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "جاري الحفظ..." : "حفظ جدول التشغيل"}
        </button>
      </div>
    </div>
  );
}
