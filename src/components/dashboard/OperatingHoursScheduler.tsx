import { useState, useEffect } from "react";
import { Clock, Save, Info } from "lucide-react";
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
      toast.error(`تجاوزت الحد الأقصى (${maxHours} ساعة) — قم بترقية الباقة`);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      operating_hours: { start: startHour, end: endHour, max: maxHours, tier: subscriptionTier },
    }).eq("id", storeId);
    if (error) toast.error("فشل حفظ ساعات التشغيل");
    else {
      toast.success("تم حفظ جدول التشغيل بنجاح");
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
    <div className="rounded-xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground font-arabic">جدول تشغيل الذكاء الاصطناعي</h3>
        </div>
        <Badge variant="outline" className="text-[10px] text-accent border-accent/30">
          {subscriptionTier === "basic" ? "أساسي — 12 ساعة" : subscriptionTier === "pro" ? "احترافي — 18 ساعة" : "مؤسسي — 24 ساعة"}
        </Badge>
      </div>

      {/* Hour usage bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-arabic">الساعات المستخدمة</span>
          <span className={`font-mono font-bold ${isOverLimit ? "text-destructive" : "text-emerald"}`}>
            {selectedHours}/{maxHours} ساعة
          </span>
        </div>
        <Progress value={usagePercent} className={`h-2 ${isOverLimit ? "[&>div]:bg-destructive" : ""}`} />
      </div>

      {/* Time selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground font-arabic block mb-2">وقت البدء</label>
          <select
            value={startHour}
            onChange={(e) => setStartHour(Number(e.target.value))}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-arabic"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-arabic block mb-2">وقت الانتهاء</label>
          <select
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-arabic"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual timeline */}
      <div className="flex gap-0.5 h-6">
        {HOURS.map((h) => {
          const isActive = endHour > startHour
            ? h >= startHour && h < endHour
            : h >= startHour || h < endHour;
          return (
            <div
              key={h}
              className={`flex-1 rounded-sm transition-colors ${
                isActive
                  ? isOverLimit ? "bg-destructive/60" : "bg-primary/60"
                  : "bg-secondary/50"
              }`}
              title={formatHour(h)}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
        <span>12 ص</span>
        <span>6 ص</span>
        <span>12 م</span>
        <span>6 م</span>
        <span>12 ص</span>
      </div>

      {isOverLimit && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3">
          <Info className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive font-arabic">
            تجاوزت الحد الأقصى للباقة ({maxHours} ساعة). قم بتقليل الساعات أو ترقية الباقة.
          </p>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving || isOverLimit} className="w-full font-arabic">
        <Save className="w-4 h-4 me-2" /> {saving ? "جاري الحفظ..." : "حفظ جدول التشغيل"}
      </Button>
    </div>
  );
}
