import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Store, BarChart3, Shield, Settings, LogOut,
  Bell, ChevronLeft, ChevronRight, Zap, Users, HelpCircle, Activity, MessageSquare, Camera, Server, Menu, X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ConnectionPulse } from "@/components/ui/connection-pulse";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { icon: LayoutDashboard, label: "نظرة عامة", path: "/dashboard" },
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

function SidebarContent({ items, collapsed, location, handleSignOut, setCollapsed, isMobile, onNavClick }: any) {
  return (
    <>
      <div className="flex items-center gap-3 p-5 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight text-foreground font-arabic">ذكاء سبلت</h1>
            <p className="text-[10px] text-muted-foreground tracking-widest font-arabic">التدقيق التشغيلي</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item: any, idx: number) => {
          const active = location.pathname === item.path;
          return (
            <Link key={idx} to={item.path} onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <item.icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : ""}`} />
              {(!collapsed || isMobile) && (
                <span className="text-sm font-medium font-arabic">{item.label}</span>
              )}
              {active && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary w-full transition-all">
          <LogOut className="w-5 h-5" />
          {(!collapsed || isMobile) && <span className="text-sm font-arabic">تسجيل خروج</span>}
        </button>
        {!isMobile && (
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-all">
            {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            {!collapsed && <span className="text-sm font-arabic">طي القائمة</span>}
          </button>
        )}
      </div>
    </>
  );
}

export default function DashboardLayout({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const items = isAdmin ? adminItems : navItems;
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "SA";

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      {/* Desktop sidebar - only on non-mobile */}
      {!isMobile && (
        <motion.aside animate={{ width: collapsed ? 72 : 260 }} className="fixed right-0 top-0 h-full z-50 glass-strong flex-col hidden md:flex">
          <SidebarContent items={items} collapsed={collapsed} location={location} handleSignOut={handleSignOut} setCollapsed={setCollapsed} isMobile={false} onNavClick={() => {}} />
        </motion.aside>
      )}

      {/* Mobile sidebar via Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-[280px] p-0 glass-strong flex flex-col md:hidden">
          <SidebarContent items={items} collapsed={false} location={location} handleSignOut={handleSignOut} setCollapsed={() => {}} isMobile={true} onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={`flex-1 transition-all ${isMobile ? "" : collapsed ? "mr-[72px]" : "mr-[260px]"}`}>
        <header className="sticky top-0 z-40 glass-strong border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-secondary text-foreground">
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="min-w-0">
                <h2 className="text-sm sm:text-lg font-semibold text-foreground font-arabic truncate">{isAdmin ? "لوحة تحكم المالك" : "لوحة التحكم"}</h2>
                <p className="text-[10px] text-muted-foreground font-mono hidden sm:block">{new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ConnectionPulse />
              <NotificationCenter />
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary to-emerald flex items-center justify-center text-[10px] sm:text-xs font-bold text-primary-foreground">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-6 carbon-grid min-h-[calc(100vh-57px)]">{children}</main>
      </div>
    </div>
  );
}
