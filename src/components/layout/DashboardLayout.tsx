import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Store, BarChart3, Shield, Settings, LogOut,
  Bell, ChevronLeft, ChevronRight, Zap, Users, HelpCircle, Activity
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Store, label: "Stores", path: "/dashboard/stores" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { icon: Shield, label: "Security", path: "/dashboard/security" },
  { icon: Activity, label: "Audit Logs", path: "/dashboard/audit" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const adminItems = [
  { icon: Users, label: "Merchants", path: "/admin" },
  { icon: Zap, label: "System Health", path: "/admin/health" },
  { icon: Shield, label: "Security Alerts", path: "/admin/alerts" },
  { icon: HelpCircle, label: "Support", path: "/admin/support" },
];

export default function DashboardLayout({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const items = isAdmin ? adminItems : navItems;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        className="fixed left-0 top-0 h-full z-50 glass-strong flex flex-col"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden">
                <h1 className="text-sm font-bold tracking-tight text-foreground">SOVEREIGN AI</h1>
                <p className="text-[10px] text-muted-foreground tracking-widest">AUDIT SUITE</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : ""}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-all"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all ${collapsed ? "ml-[72px]" : "ml-[260px]"}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 glass-strong border-b border-border">
          <div className="flex items-center justify-between px-6 py-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isAdmin ? "Admin Console" : "Merchant Dashboard"}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                {new Date().toLocaleDateString("en-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald flex items-center justify-center text-xs font-bold text-primary-foreground">
                SA
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 carbon-grid min-h-[calc(100vh-57px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
