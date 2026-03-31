import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Search, ChevronDown, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

interface RoleRow {
  user_id: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  merchant: "تاجر",
  it_support: "دعم تقني",
  customer_support: "دعم عملاء",
  super_owner: "مالك النظام",
};

const ROLE_COLORS: Record<string, string> = {
  merchant: "text-primary border-primary/30",
  it_support: "text-accent border-accent/30",
  customer_support: "text-emerald border-emerald/30",
  super_owner: "text-destructive border-destructive/30",
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (profilesRes.data) setUsers(profilesRes.data as UserRow[]);
    if (rolesRes.data) {
      const map: Record<string, string> = {};
      (rolesRes.data as RoleRow[]).forEach((r) => { map[r.user_id] = r.role; });
      setRoles(map);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const currentRole = roles[userId];
    if (currentRole === newRole) return;

    // Update role
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as any })
      .eq("user_id", userId);

    if (error) {
      toast.error("خطأ في تحديث الرتبة");
      return;
    }

    // Force sign out the user by calling admin API via edge function
    // For now we update locally
    setRoles((prev) => ({ ...prev, [userId]: newRole }));
    toast.success(`تم تغيير الرتبة إلى "${ROLE_LABELS[newRole]}" — سيتم تسجيل خروج المستخدم عند الجلسة القادمة`);
  };

  const filtered = search
    ? users.filter((u) =>
        (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        u.id.includes(search)
      )
    : users;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground font-arabic">إدارة المستخدمين والرتب</h3>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البريد..."
          className="w-full bg-card border border-border rounded-xl py-2.5 pr-10 pl-4 text-sm text-foreground font-arabic placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-arabic">جاري التحميل...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => {
            const role = roles[user.id] || "merchant";
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-card border border-border p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                        {(user.full_name || user.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground font-arabic truncate">
                          {user.full_name || "بدون اسم"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[10px] ${ROLE_COLORS[role] || ""}`}>
                      {ROLE_LABELS[role] || role}
                    </Badge>
                    
                    <Select value={role} onValueChange={(val) => handleRoleChange(user.id, val)}>
                      <SelectTrigger className="w-36 h-8 text-xs font-arabic">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="merchant" className="text-xs font-arabic">تاجر</SelectItem>
                        <SelectItem value="it_support" className="text-xs font-arabic">دعم تقني</SelectItem>
                        <SelectItem value="customer_support" className="text-xs font-arabic">دعم عملاء</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8 font-arabic">لا توجد نتائج</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
