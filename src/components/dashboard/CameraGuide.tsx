import { useState } from "react";
import { Camera, ChevronRight, ExternalLink, LifeBuoy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CAMERA_BRANDS = [
  {
    id: "hikvision",
    name: "Hikvision",
    nameAr: "هيكفيجن",
    logo: "📹",
    rtspTemplate: "rtsp://{user}:{pass}@{ip}:554/Streaming/Channels/101",
    steps: [
      "افتح متصفح الويب وأدخل عنوان IP الكاميرا",
      "سجل الدخول باسم المستخدم وكلمة المرور (الافتراضي: admin)",
      "اذهب إلى Configuration → Network → Advanced Settings → RTSP",
      "تأكد من أن المنفذ 554 مفعّل",
      "رابط RTSP الافتراضي: rtsp://admin:password@IP:554/Streaming/Channels/101",
    ],
  },
  {
    id: "dahua",
    name: "Dahua",
    nameAr: "داهوا",
    logo: "🎥",
    rtspTemplate: "rtsp://{user}:{pass}@{ip}:554/cam/realmonitor?channel=1&subtype=0",
    steps: [
      "افتح واجهة الويب الخاصة بالكاميرا عبر المتصفح",
      "سجل الدخول (الافتراضي: admin / admin)",
      "اذهب إلى Setup → Network → RTSP",
      "تأكد من تفعيل خدمة RTSP",
      "رابط RTSP الافتراضي: rtsp://admin:password@IP:554/cam/realmonitor?channel=1&subtype=0",
    ],
  },
  {
    id: "ezviz",
    name: "EZVIZ",
    nameAr: "إيزفيز",
    logo: "👁️",
    rtspTemplate: "rtsp://admin:{verification_code}@{ip}:554/h264/ch1/main/av_stream",
    steps: [
      "افتح تطبيق EZVIZ على الجوال",
      "اذهب إلى إعدادات الكاميرا → معلومات الجهاز",
      "دوّن رمز التحقق (Verification Code) الموجود على ملصق الكاميرا",
      "تأكد من تفعيل RTSP في الإعدادات المتقدمة",
      "رابط RTSP: rtsp://admin:VERIFICATION@IP:554/h264/ch1/main/av_stream",
    ],
  },
  {
    id: "other",
    name: "Other",
    nameAr: "أخرى",
    logo: "📷",
    rtspTemplate: "rtsp://{user}:{pass}@{ip}:554/stream",
    steps: [
      "راجع دليل المستخدم الخاص بالكاميرا للحصول على رابط RTSP",
      "تأكد من تفعيل خدمة RTSP في إعدادات الشبكة",
      "المنفذ الافتراضي عادةً هو 554",
      "إذا واجهت صعوبة، اضغط على 'طلب دعم فني' أدناه",
    ],
  },
];

interface Props {
  storeId?: string;
  onRequestSupport?: () => void;
}

export function CameraGuide({ storeId, onRequestSupport }: Props) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const { user } = useAuth();

  const brand = CAMERA_BRANDS.find((b) => b.id === selectedBrand);

  const handleRequestSupport = async () => {
    if (!user) return;
    if (onRequestSupport) { onRequestSupport(); return; }
    
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      store_id: storeId || null,
      subject: "طلب دعم ميداني للتركيب",
      description: `طلب مساعدة في تركيب وربط الكاميرا${brand ? ` (${brand.name})` : ""}. يرجى التواصل لتنسيق زيارة فنية.`,
      priority: "high",
    });
    if (error) toast.error("فشل إرسال الطلب");
    else toast.success("✅ تم إرسال طلب الدعم الميداني — سيتواصل معك الفريق التقني قريباً");
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground font-arabic">مساعد ربط الكاميرا</h3>
      </div>

      {!selectedBrand ? (
        <>
          <p className="text-xs text-muted-foreground font-arabic">اختر نوع الكاميرا لعرض تعليمات الربط المخصصة:</p>
          <div className="grid grid-cols-2 gap-3">
            {CAMERA_BRANDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(b.id)}
                className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all text-right"
              >
                <span className="text-2xl">{b.logo}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground font-arabic">{b.nameAr}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ms-auto" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{brand?.logo}</span>
              <div>
                <p className="text-sm font-bold text-foreground">{brand?.name}</p>
                <p className="text-[10px] text-muted-foreground font-arabic">{brand?.nameAr}</p>
              </div>
            </div>
            <button onClick={() => setSelectedBrand(null)} className="text-xs text-primary hover:underline font-arabic">
              تغيير النوع
            </button>
          </div>

          {/* RTSP Template */}
          <div className="rounded-lg bg-secondary/80 border border-border p-3">
            <p className="text-[10px] text-muted-foreground font-arabic mb-1">قالب رابط RTSP:</p>
            <code className="text-xs text-primary font-mono break-all">{brand?.rtspTemplate}</code>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground font-arabic">خطوات الربط:</p>
            {brand?.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-xs text-foreground font-arabic leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          {/* Support Button */}
          <Button onClick={handleRequestSupport} variant="outline" className="w-full border-accent/30 text-accent hover:bg-accent/10 font-arabic">
            <LifeBuoy className="w-4 h-4 me-2" /> طلب دعم فني للتركيب
          </Button>
        </>
      )}
    </div>
  );
}
