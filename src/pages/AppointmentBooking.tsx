import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, CheckCircle, Phone, Video, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AVAILABLE_SLOTS = [
  { time: "16:00", label: "4:00 م" },
  { time: "16:30", label: "4:30 م" },
  { time: "17:00", label: "5:00 م" },
  { time: "17:30", label: "5:30 م" },
];

export default function AppointmentBooking() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("stores").select("id, name").eq("user_id", user.id).then(({ data }) => {
      if (data && data.length > 0) {
        setStores(data);
        setSelectedStore(data[0].id);
      }
    });
  }, [user]);

  // Generate next 7 working days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    // Skip Friday (5) - Saudi weekend
    if (d.getDay() === 5) d.setDate(d.getDate() + 1);
    return {
      value: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" }),
    };
  });

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot || !selectedStore || !user) return;
    setBooking(true);

    // Create a support ticket as an appointment
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      store_id: selectedStore,
      subject: `📅 حجز جلسة تفعيل — ${selectedDate} الساعة ${selectedSlot}`,
      description: `طلب جلسة تفعيل يدوية للمتجر. الموعد: ${selectedDate} الساعة ${selectedSlot}. يرجى التواصل مع التاجر عبر الشات في التذكرة.`,
      priority: "medium",
    });

    if (error) {
      toast.error("فشل حجز الموعد");
    } else {
      toast.success("✅ تم حجز موعد التفعيل بنجاح");
      setBooked(true);
    }
    setBooking(false);
  };

  if (booked) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-full bg-emerald/10 border border-emerald/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald" />
            </div>
            <h2 className="text-xl font-bold text-foreground font-arabic">تم حجز الموعد بنجاح</h2>
            <p className="text-sm text-muted-foreground font-arabic">
              سيتواصل معك فريقنا التقني في الموعد المحدد: <br />
              <span className="text-foreground font-bold">{selectedDate} — الساعة {selectedSlot}</span>
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <Badge variant="outline" className="text-xs text-emerald border-emerald/30 font-arabic">
                <Phone className="w-3 h-3 me-1" /> دعم فوري
              </Badge>
              <Badge variant="outline" className="text-xs text-primary border-primary/30 font-arabic">
                <Video className="w-3 h-3 me-1" /> جلسة عن بُعد
              </Badge>
            </div>
            <Button variant="outline" onClick={() => window.history.back()} className="mt-4 font-arabic">
              <ArrowLeft className="w-4 h-4 me-2" /> العودة للداشبورد
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-foreground font-arabic">📅 حجز جلسة تفعيل</h1>
          <p className="text-sm text-muted-foreground mt-1 font-arabic">
            اختر الموعد المناسب لك وسيتولى فريقنا التقني ربط الكاميرا عن بُعد
          </p>
        </motion.div>

        {/* Store selector */}
        {stores.length > 1 && (
          <div className="rounded-xl bg-card border border-border p-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-arabic">المتجر</label>
            <div className="flex gap-2 flex-wrap">
              {stores.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStore(s.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-arabic transition-all ${
                    selectedStore === s.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date Selection */}
        <div className="rounded-xl bg-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground font-arabic">اختر اليوم</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {dates.map(d => (
              <button
                key={d.value}
                onClick={() => setSelectedDate(d.value)}
                className={`p-3 rounded-xl text-center text-sm font-arabic transition-all ${
                  selectedDate === d.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card border border-border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground font-arabic">اختر الوقت</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_SLOTS.map(slot => (
                <button
                  key={slot.time}
                  onClick={() => setSelectedSlot(slot.label)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    selectedSlot === slot.label
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  <Clock className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm font-arabic">{slot.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Confirm */}
        {selectedDate && selectedSlot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button
              onClick={handleBook}
              disabled={booking}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-arabic h-12 text-base"
            >
              {booking ? "جاري الحجز..." : `✅ تأكيد الحجز — ${selectedDate} الساعة ${selectedSlot}`}
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
