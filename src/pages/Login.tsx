import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, roles, hasRole } = useAuth();

  const getRedirectPath = () => {
    if (hasRole("super_owner")) return "/admin";
    if (hasRole("it_support")) return "/it-dashboard";
    return "/dashboard";
  };

  // Redirect if already logged in
  if (user && roles.length > 0) {
    navigate(getRedirectPath());
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      // Wait briefly for roles to load, then redirect
      setTimeout(async () => {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "");
        const userRoles = rolesData?.map((r: any) => r.role) || [];
        if (userRoles.includes("super_owner")) navigate("/admin");
        else if (userRoles.includes("it_support")) navigate("/it-dashboard");
        else navigate("/dashboard");
      }, 300);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background carbon-grid relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md mx-4">
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5 glow-blue">
            <Shield className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Sovereign AI</h1>
          <p className="text-sm text-muted-foreground mt-1">Operational Auditing Suite</p>
        </div>

        <div className="glass-strong rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-xs text-accent font-semibold uppercase tracking-widest">Secure Access</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="merchant@example.com" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-11" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-11 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              {loading ? "Signing in..." : "Sign In"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 font-semibold"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("apple", {
                  redirect_uri: window.location.origin,
                });
                if (error) toast.error(error.message);
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Sign in with Apple
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              New merchant?{" "}
              <button onClick={() => navigate("/signup")} className="text-primary hover:underline font-medium">Create an account</button>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6 font-mono">
          🔒 256-BIT ENCRYPTED · SAUDI DATA RESIDENCY · PDPL COMPLIANT
        </p>
      </motion.div>
    </div>
  );
}
