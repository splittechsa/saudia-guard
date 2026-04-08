import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, Search, ChevronDown, UserCog, Mail, IdCard, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ... (نفس الـ Interfaces والـ ROLE_LABELS السابقة)

const ROLE_THEMES: Record<string, { bg: string, text: string, icon: any }> = {
  merchant: { bg: "bg-primary/10", text: "text-primary border-primary/20", icon: Users },
  it_support: { bg: "bg-tech-blue/10", text: "text-tech-blue border-tech-blue/20", icon: Shield },
  customer_support: { bg: "bg-emerald/10", text: "text-emerald border-emerald/20", icon: UserCog },
  super_owner: { bg: "bg-destructive/10", text: "text-destructive border-destructive/20", icon: Shield },
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ... (نفس دالة fetchUsers السابقة)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
      
      {/* Header مع شريط البحث */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary/30 p-6 rounded-[2rem] border border-border/50">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground font-arabic tracking-tight">إدارة الهويات والرتب</h3>
            <p className="text-[10px] text-muted-foreground font-arabic uppercase tracking-widest mt-1">SplitTech Internal Access Control</p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن شريك أو موظف..."
            className="bg-background border-border/50 rounded-xl pr-10 font-arabic h-11"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-50">
           <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
           <p className="text-xs font-bold font-arabic text-muted-foreground">جاري استدعاء سجلات المستخدمين...</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {filtered.map((user) => {
              const role = roles[user.id] || "merchant";
              const theme = ROLE_THEMES[role] || ROLE_THEMES.merchant;
              
              return (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group glass-strong rounded-2xl border border-border p-4 hover:border-primary/30 transition-all shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center text-lg font-black text-primary/60 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                          {(user.full_name || user.email || "?")[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background border border-border rounded-full flex items-center justify-center shadow-lg">
                           <theme.icon className={`w-3 h-3 ${theme.text.split(' ')[0]}`} />
                        </div>
                      </div>
                      
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-black text-foreground font-arabic truncate">{user.full_name || "مستخدم غير معروف"}</p>
                           {role === 'super_owner' && <BadgeCheck className="w-3 h-3 text-primary" />}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                          <span className="hidden md:flex items-center gap-1 opacity-50"><IdCard className="w-3 h-3" /> {user.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-secondary/20 p-2 rounded-xl border border-border/50">
                      <Badge variant="outline" className={`px-3 py-1 rounded-lg text-[9px] font-bold font-arabic border-none ${theme.bg} ${theme.text}`}>
                        {ROLE_LABELS[role] || role}
                      </Badge>
                      
                      <Select value={role} onValueChange={(val) => handleRoleChange(user.id, val)}>
                        <SelectTrigger className="w-32 h-8 text-[10px] font-bold font-arabic bg-background border-border/50 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                          {Object.entries(ROLE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="text-xs font-arabic">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {filtered.length === 0 && (
            <div className="text-center py-20 opacity-30">
               <Search className="w-12 h-12 mx-auto mb-4" />
               <p className="text-sm font-bold font-arabic">لا يوجد مستخدم يطابق بحثك</p>
            </div>
          )}
        </div>
      )}

      {/* Security Info Footnote */}
      <div className="mt-8 p-4 rounded-2xl border border-dashed border-border flex items-center gap-3 opacity-50">
         <Shield className="w-4 h-4 text-primary" />
         <p className="text-[10px] font-arabic text-muted-foreground">
           تنبيه: تغيير رتبة المستخدم يؤثر فوراً على صلاحيات الوصول للجداول والوظائف السحابية. يرجى التأكد قبل التعديل.
         </p>
      </div>
    </motion.div>
  );
}

// مكون BadgeCheck بسيط للتمييز
function BadgeCheck({ className }: { className?: string }) {
  return (
    <div className={`p-0.5 bg-primary rounded-full ${className}`}>
      <CheckCircle2 className="w-2 h-2 text-primary-foreground" />
    </div>
  );
}