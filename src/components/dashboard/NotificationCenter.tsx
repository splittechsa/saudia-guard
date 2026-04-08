import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, AlertTriangle, MessageSquare, WifiOff, X, 
  Check, ShieldAlert, Zap, Inbox, CheckCircle2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

// ... (نفس الـ Interface السابقة)

export function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // جلب التنبيهات الأولية
  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    
    const [alertsRes, ticketsRes] = await Promise.all([
      supabase.from("security_alerts").select("id, alert_type, message, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("support_tickets").select("id, subject, status, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
    ]);

    const items: Notification[] = [];
    alertsRes.data?.forEach((a: any) => {
      items.push({
        id: `alert-${a.id}`,
        type: "security",
        title: a.alert_type === "critical" ? "🚨 تهديد أمني حرج" : "⚠️ تنبيه أمني",
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
          title: "📋 تحديث الدعم الفني",
          message: `تذكرة: ${t.subject} أصبحت الآن (${t.status === "resolved" ? "محلولة" : "قيد المعالجة"})`,
          time: t.updated_at,
          read: false,
        });
      }
    });

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setNotifications(items.slice(0, 15));
  }, [user]);

  useEffect(() => {
    fetchAlerts();

    // الاشتراك اللحظي (Real-time Channels)
    const ch = supabase
      .channel("live-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "security_alerts" }, (payload) => {
        const a = payload.new as any;
        setIsAnimating(true);
        setNotifications((prev) => [{
          id: `alert-${a.id}`,
          type: "security",
          title: "🚨 تنبيه أمني جديد",
          message: a.message,
          time: a.created_at,
          read: false,
        }, ...prev].slice(0, 20));
        setTimeout(() => setIsAnimating(false), 1000);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets" }, (payload) => {
        const t = payload.new as any;
        if (t.user_id === user?.id) {
          setIsAnimating(true);
          setNotifications((prev) => [{
            id: `ticket-upd-${t.id}-${Date.now()}`,
            type: "ticket",
            title: "📋 تحديث في تذكرتك",
            message: `الموضوع: ${t.subject} — تم تحديث الحالة.`,
            time: t.updated_at,
            read: false,
          }, ...prev].slice(0, 20));
          setTimeout(() => setIsAnimating(false), 1000);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user, fetchAlerts]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "security": return <ShieldAlert className="w-4 h-4 text-destructive" />;
      case "ticket": return <MessageSquare className="w-4 h-4 text-primary" />;
      case "offline": return <WifiOff className="w-4 h-4 text-orange-500" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative" dir="rtl">
      {/* الجرس مع أنيميشن النبض عند وصول إشعار جديد */}
      <motion.button
        animate={isAnimating ? { rotate: [0, 15, -15, 10, -10, 0] } : {}}
        transition={{ duration: 0.5 }}
        onClick={() => setOpen(!open)}
        className={`relative p-2.5 rounded-xl transition-all ${open ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-primary text-[9px] font-black text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 15, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute left-0 top-14 z-50 w-[380px] max-h-[520px] rounded-[2rem] glass-strong border border-border shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-border bg-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Zap className="w-4 h-4 text-primary" />
                   <h3 className="text-sm font-black text-foreground font-arabic tracking-tight">آخر التحديثات</h3>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-bold text-primary hover:brightness-125 transition-all font-arabic">
                      تصفير التنبيهات
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[400px] custom-scrollbar divide-y divide-border/50">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center space-y-3 opacity-30">
                    <Inbox className="w-12 h-12 mx-auto" />
                    <p className="text-xs font-bold font-arabic">لا توجد إشعارات حالياً</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group flex items-start gap-4 p-4 transition-all hover:bg-primary/5 cursor-pointer relative ${!n.read ? "bg-primary/[0.03]" : ""}`}
                      onClick={() => setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item))}
                    >
                      <div className={`mt-1 p-2 rounded-xl bg-background border border-border group-hover:border-primary/30 transition-colors shadow-sm`}>
                         {iconForType(n.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                           <p className={`text-xs font-bold font-arabic ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                           <span className="text-[9px] font-mono text-muted-foreground/50 whitespace-nowrap">
                             {new Date(n.time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-arabic leading-relaxed line-clamp-2">{n.message}</p>
                        
                        <div className="flex items-center justify-between pt-1">
                           <p className="text-[9px] text-muted-foreground/40 font-arabic">
                             {new Date(n.time).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                           </p>
                           {!n.read && (
                             <span className="flex items-center gap-1 text-[9px] text-primary font-bold animate-pulse">
                               <CheckCircle2 className="w-3 h-3" /> جديد
                             </span>
                           )}
                        </div>
                      </div>
                      {!n.read && <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary" />}
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-secondary/10 border-t border-border text-center">
                 <Button variant="ghost" className="w-full h-8 text-[10px] font-bold text-muted-foreground hover:text-primary font-arabic">
                    عرض جميع سجلات النظام
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}