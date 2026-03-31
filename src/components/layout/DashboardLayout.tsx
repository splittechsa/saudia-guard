import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Store, BarChart3, Shield, Settings, LogOut,
  Bell, ChevronLeft, ChevronRight, Zap, Users, HelpCircle, Activity, MessageSquare, Camera, Server
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ConnectionPulse } from "@/components/ui/connection-pulse";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";

const navItems = [
  { icon: LayoutDashboard, label: "نظرة عامة", path: "/dashboard" },
  { icon: BarChart3, label: "التقارير", path: "/dashboard/reports" },
  { icon: Camera, label: "إعداد المتجر", path: "/dashboard/store-setup" },
  { icon: Activity, label: "التدقيقات", path: "/dashboard/audit" },
  { icon: MessageSquare, label: "الدعم الفني", path: "/support" },
  { icon: Settings, label: "الإعدادات", path: "/dashboard/settings" },
];

const adminItems = [
  { icon: LayoutDashboard, label: "نظرة عامة", path: "/admin" },
  { icon: Server, label: "حالة النظام", path: "/admin/system-status" },
  { icon: Users, label: "التجار والمتاجر", path: "/admin" },
  { icon: Shield, label: "التنبيهات الأمنية", path: "/admin" },
  { icon: MessageSquare, label: "تذاكر الدعم", path: "/admin" },
];

export default function DashboardLayout({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const items = isAdmin ? adminItems : navItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "SA";

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <motion.aside animate={{ width: collapsed ? 72 : 260 }} className="fixed right-0 top-0 h-full z-50 glass-strong flex flex-col">
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden">
                <h1 className="text-sm font-bold tracking-tight text-foreground font-arabic">ذكاء سبلت</h1>
                <p className="text-[10px] text-muted-foreground tracking-widest font-arabic">التدقيق التشغيلي</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {items.map((item, idx) => {
            const active = location.pathname === item.path;
            return (
              <Link key={idx} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <item.icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : ""}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium font-arabic">{item.label}</motion.span>
                  )}
                </AnimatePresence>
                {active && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary w-full transition-all">
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-arabic">تسجيل خروج</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-all">
            {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            {!collapsed && <span className="text-sm font-arabic">طي القائمة</span>}
          </button>
        </div>
      </motion.aside>

      <div className={`flex-1 transition-all ${collapsed ? "mr-[72px]" : "mr-[260px]"}`}>
        <header className="sticky top-0 z-40 glass-strong border-b border-border">
          <div className="flex items-center justify-between px-6 py-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground font-arabic">{isAdmin ? "لوحة تحكم المالك" : "لوحة تحكم التاجر"}</h2>
              <p className="text-xs text-muted-foreground font-mono">{new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div className="flex items-center gap-3">
              <ConnectionPulse />
              <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald flex items-center justify-center text-xs font-bold text-primary-foreground">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 carbon-grid min-h-[calc(100vh-57px)]">{children}</main>
      </div>
    </div>
  );
}
