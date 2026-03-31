import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, MessageSquare, Wifi, WifiOff, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  type: "security" | "ticket" | "offline";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial alerts
    const fetchAlerts = async () => {
      const [alertsRes, ticketsRes] = await Promise.all([
        supabase.from("security_alerts").select("id, alert_type, message, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("support_tickets").select("id, subject, status, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
      ]);

      const items: Notification[] = [];
      alertsRes.data?.forEach((a: any) => {
        items.push({
          id: `alert-${a.id}`,
          type: "security",
          title: a.alert_type === "critical" ? "🚨 تنبيه حرج" : "⚠️ تنبيه أمني",
          message: a.message,
          time: a.created_at,
          read: false,
        });
      });
      ticketsRes.data?.forEach((t: any) => {
        if (t.status !== "open") {
          items.push({
            id: `ticket-${t.id}`,
            type: "ticket",
            title: "📋 تحديث تذكرة الدعم",
            message: `${t.subject} — الحالة: ${t.status === "resolved" ? "تم الحل" : t.status === "in_progress" ? "جاري العمل" : t.status}`,
            time: t.updated_at,
            read: false,
          });
        }
      });

      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(items.slice(0, 15));
    };
    fetchAlerts();

    // Real-time security alerts
    const ch = supabase
      .channel("notif-center")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "security_alerts" }, (payload) => {
        const a = payload.new as any;
        setNotifications((prev) => [{
          id: `alert-${a.id}`,
          type: "security" as const,
          title: "🚨 تنبيه أمني جديد",
          message: a.message,
          time: a.created_at,
          read: false,
        }, ...prev].slice(0, 20));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets" }, (payload) => {
        const t = payload.new as any;
        if (t.user_id === user.id) {
          setNotifications((prev) => [{
            id: `ticket-upd-${t.id}-${Date.now()}`,
            type: "ticket" as const,
            title: "📋 تحديث تذكرة",
            message: `${t.subject} — ${t.status === "resolved" ? "تم الحل ✅" : t.status}`,
            time: t.updated_at,
            read: false,
          }, ...prev].slice(0, 20));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "security": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "ticket": return <MessageSquare className="w-4 h-4 text-primary" />;
      case "offline": return <WifiOff className="w-4 h-4 text-accent" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute left-0 top-12 z-50 w-[360px] max-h-[480px] rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground font-arabic">مركز التنبيهات</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-primary hover:underline font-arabic">
                      قراءة الكل
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[400px] divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm font-arabic">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    لا توجد تنبيهات
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-3 transition-colors hover:bg-secondary/30 ${!n.read ? "bg-primary/5" : ""}`}
                      onClick={() => setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item))}
                    >
                      <div className="mt-0.5">{iconForType(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground font-arabic">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground font-arabic mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">
                          {new Date(n.time).toLocaleString("ar-SA", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                        </p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
