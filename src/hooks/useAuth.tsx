import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_owner" | "it_support" | "customer_support" | "merchant";

const VALID_ROLES: AppRole[] = ["super_owner", "it_support", "customer_support", "merchant"];

const isAppRole = (value: string): value is AppRole => {
  return VALID_ROLES.includes(value as AppRole);
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  profile: { full_name: string; email: string } | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  getDefaultRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);

  const fetchUserData = useCallback(async (userId: string) => {
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("full_name, email").eq("id", userId).single(),
    ]);

    if (rolesRes.error) {
      setRoles([]);
    } else {
      const normalizedRoles = (rolesRes.data || [])
        .map((r: { role: string }) => r.role)
        .filter(isAppRole);
      setRoles(normalizedRoles);
    }

    if (profileRes.data) {
      setProfile(profileRes.data as { full_name: string; email: string });
    } else {
      setProfile(null);
    }
  }, []);

  const getDefaultRoute = useCallback(() => {
    if (roles.includes("super_owner")) return "/admin";
    if (roles.includes("it_support")) return "/it-dashboard";
    return "/dashboard";
  }, [roles]);

  useEffect(() => {
    const hydrateFromSession = async (nextSession: Session | null) => {
      setLoading(true);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await fetchUserData(nextSession.user.id);
      } else {
        setRoles([]);
        setProfile(null);
      }

      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrateFromSession(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      void hydrateFromSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setProfile(null);
  };

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  const contextValue = useMemo(
    () => ({ user, session, loading, roles, profile, signUp, signIn, signOut, hasRole, getDefaultRoute }),
    [user, session, loading, roles, profile, hasRole, getDefaultRoute]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
