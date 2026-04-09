import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, ShieldCheck, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { oauth } from "@/integrations/supabase-oauth";
import { toast } from "sonner";
import splitLogo from "@/assets/split-logo-icon.png";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading, getDefaultRoute } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(getDefaultRoute(), { replace: true });
    }
  }, [authLoading, user, navigate, getDefaultRoute]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error("خطأ في تسجيل الدخول، يرجى التحقق من البيانات");
    } else {
      toast.success("تم تسجيل الدخول بنجاح");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background carbon-grid relative overflow-hidden" dir="rtl">
      {/* تأثيرات الإضاءة الخلفية - توحي بالتطور */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }} 
        className="w-full max-w-md mx-4 z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }} 
            animate={{ scale: 1 }} 
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mb-6 shadow-2xl"
          >
            <img src={splitLogo} alt="Split Tech" className="w-12 h-12 object-contain" />
          </motion.div>
          <h1 className="text-3xl font-black text-foreground tracking-tight font-arabic mb-2">سبلت تيك</h1>
          <p className="text-sm text-muted-foreground font-arabic">منصة التدقيق والذكاء التشغيلي للمتاجر</p>
        </div>

        <div className="glass-strong rounded-[2rem] p-8 border border-border/50 shadow-2xl relative">
          {/* شارة الأمان داخل الكرت */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary border border-border px-4 py-1 rounded-full flex items-center gap-2">
            <Lock className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Secure Access</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/70 mr-1 font-arabic block">البريد الإلكتروني للعمل</label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                type="email" 
                placeholder="name@company.sa" 
                className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground/40 h-12 rounded-xl focus:ring-primary/20" 
                dir="ltr" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold text-foreground/70 font-arabic">كلمة المرور</label>
                <button type="button" className="text-[10px] text-primary hover:opacity-80 font-arabic">نسيت كلمة المرور؟</button>
              </div>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground/40 h-12 rounded-xl pe-10 focus:ring-primary/20" 
                  dir="ltr" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl transition-all shadow-lg shadow-primary/20 group"
            >
              {loading ? "جاري التحقق..." : "تسجيل الدخول"} 
              <ArrowLeft className="w-4 h-4 ms-2 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 font-bold rounded-xl border-border/50 hover:bg-secondary/50 transition-all flex items-center justify-center gap-3"
              onClick={async () => {
                const { error } = await oauth.auth.signInWithOAuth("apple", {
                  redirect_uri: window.location.origin,
                });
                if (error) toast.error(error.message);
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              <span>متابعة بواسطة Apple</span>
            </Button>

            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-xs text-muted-foreground font-arabic">
                ليس لديك حساب شريك؟{" "}
                <button onClick={() => navigate("/signup")} className="text-primary font-bold hover:brightness-125">انضم إلينا الآن</button>
              </p>
            </div>
          </div>
        </div>

        {/* شريط الأمان والالتزام - هنا نلعب دور المنصة الكبرى */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 opacity-50 grayscale hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-foreground uppercase tracking-tighter">
            <ShieldCheck className="w-3 h-3 text-primary" />
            PDPL Compliant
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-foreground uppercase tracking-tighter">
            <Globe className="w-3 h-3 text-primary" />
            Saudi Data Residency
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-foreground uppercase tracking-tighter">
            <Lock className="w-3 h-3 text-primary" />
            AES-256 Encrypted
          </div>
        </div>

        <p className="text-center text-[9px] text-muted-foreground/40 mt-6 font-mono tracking-[0.2em]">
          SPLIT TECH © 2026 — JEDDAH, KSA · GOOGLE CLOUD DOMAIN
        </p>
      </motion.div>
    </div>
  );
}