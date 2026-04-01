import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Shield, Settings, LogOut,
  Users, Activity, MessageSquare, Camera, Server, Menu, X,
  Home, Headphones, Cog, Sliders
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ConnectionPulse } from "@/components/ui/connection-pulse";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { icon: LayoutDashboard, label: "نظرة عامة", path: "/dashboard" },
  { icon: Activity, label: "التدقيقات", path: "/dashboard/audit" },
  { icon: Sliders, label: "تحكم المتجر", path: "/dashboard/store-control" },
  { icon: Camera, label: "إعداد المتجر", path: "/dashboard/store-setup" },
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

const mobileBottomNav = [
  { icon: Home, label: "الرئيسية", path: "/dashboard" },
  { icon: Activity, label: "التدقيقات", path: "/dashboard/audit" },
  { icon: Sliders, label: "التحكم", path: "/dashboard/store-control" },
  { icon: Headphones, label: "الدعم", path: "/support" },
  { icon: Cog, label: "الإعدادات", path: "/dashboard/settings" },
];

const adminBottomNav = [
  { icon: Home, label: "الرئيسية", path: "/admin" },
  { icon: Server, label: "النظام", path: "/admin/system-status" },
  { icon: Users, label: "التجار", path: "/admin" },
  { icon: MessageSquare, label: "التذاكر", path: "/admin" },
];

export default function DashboardLayout({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const items = isAdmin ? adminItems : navItems;
  const bottomItems = isAdmin ? adminBottomNav : mobileBottomNav;
  const isMobile = useIsMobile();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isMobile, sidebarOpen]);

  const handleSignOut = async () => {
    setSidebarOpen(false);
    await signOut();
    navigate("/login");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "SA";

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden" dir="rtl">

      {/* ════════════════════════════════════════ */}
      {/* DESKTOP SIDEBAR — hidden on mobile      */}
      {/* ════════════════════════════════════════ */}
      <aside
        style={{ width: collapsed ? 72 : 260 }}
        className="fixed right-0 top-0 h-full z-50 glass-strong flex-col transition-all duration-300 hidden md:flex"
      >
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold tracking-tight text-foreground font-arabic">ذكاء سبلت</h1>
              <p className="text-[10px] text-muted-foreground tracking-widest font-arabic">التدقيق التشغيلي</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item, idx) => {
            const active = location.pathname === item.path;
            return (
              <Link key={idx} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <item.icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : ""}`} />
                {!collapsed && <span className="text-sm font-medium font-arabic">{item.label}</span>}
                {active && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
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
            <Menu className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-arabic">طي القائمة</span>}
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════════════ */}
      {/* MOBILE SIDEBAR DRAWER — overlay style   */}
      {/* ════════════════════════════════════════ */}
      {isMobile && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
              sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className={`fixed top-0 right-0 h-full w-[85%] max-w-[320px] z-[70] bg-card border-l border-border flex flex-col transition-transform duration-300 ease-out md:hidden ${
              sidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-foreground font-arabic">ذكاء سبلت</h1>
                  <p className="text-[10px] text-muted-foreground font-arabic">التدقيق التشغيلي</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
              {items.map((item, idx) => {
                const active = location.pathname === item.path;
                return (
                  <Link key={idx} to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}>
                    <item.icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : ""}`} />
                    <span className="text-sm font-medium font-arabic">{item.label}</span>
                    {active && <div className="mr-auto w-2 h-2 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-border" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
              {/* Profile */}
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate font-arabic">{profile?.full_name || "المستخدم"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{profile?.email}</p>
                </div>
              </div>
              <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-all">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-arabic">تسجيل خروج</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════ */}
      {/* MAIN CONTENT AREA                       */}
      {/* ════════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col min-h-screen w-full"
        style={{ marginRight: isMobile ? 0 : collapsed ? 72 : 260 }}
      >
        {/* Top header */}
        <header className="sticky top-0 z-40 glass-strong border-b border-border">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger */}
              {isMobile && (
                <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-1 rounded-lg hover:bg-secondary text-foreground shrink-0">
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="min-w-0">
                <h2 className="text-sm md:text-lg font-semibold text-foreground font-arabic truncate">
                  {isAdmin ? "لوحة تحكم المالك" : "لوحة التحكم"}
                </h2>
                <p className="text-[10px] text-muted-foreground font-mono hidden md:block">
                  {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ConnectionPulse />
              <NotificationCenter />
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-primary to-emerald flex items-center justify-center text-[10px] md:text-xs font-bold text-primary-foreground shrink-0">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 px-4 md:px-6 py-4 md:py-6 carbon-grid ${isMobile ? "pb-24" : ""}`}>
          {children}
        </main>

        {/* ════════════════════════════════════════ */}
        {/* MOBILE BOTTOM NAVIGATION BAR            */}
        {/* ════════════════════════════════════════ */}
        {isMobile && (
          <nav
            className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex items-center justify-between px-6 py-2">
              {bottomItems.map((item, idx) => {
                const active = location.pathname === item.path;
                return (
                  <Link key={idx} to={item.path} className="flex flex-col items-center gap-1 py-1 min-w-[56px]">
                    <item.icon className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-[10px] font-arabic transition-colors ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                    {active && <div className="w-1 h-1 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
