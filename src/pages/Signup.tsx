import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, UserPlus, ShieldCheck, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import splitLogo from "@/assets/split-logo-icon.png";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("أهلاً بك! تم إنشاء حسابك بنجاح، يرجى تفعيل البريد الإلكتروني");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background carbon-grid relative overflow-hidden" dir="rtl">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

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
            className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-primary/10 border border-primary/20 mb-6 shadow-2xl"
          >
            <img src={splitLogo} alt="Split Tech" className="w-12 h-12 object-contain" />
          </motion.div>
          <h1 className="text-3xl font-black text-foreground tracking-tight font-arabic mb-2">ابدأ مع سبلت تيك</h1>
          <p className="text-sm text-muted-foreground font-arabic">انضم لمستقبل التدقيق الذكي للمتاجر</p>
        </div>

        <div className="glass-strong rounded-[2.5rem] p-8 border border-border/50 shadow-2xl relative">
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary border border-border px-4 py-1 rounded-full flex items-center gap-2">
            <UserPlus className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">New Merchant</span>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/70 mr-1 font-arabic block">الاسم التجاري أو الشخصي</label>
              <Input 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="مثال: شركة سبلت تيك" 
                className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground/30 h-12 rounded-xl focus:ring-primary/20" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/70 mr-1 font-arabic block">البريد الإلكتروني للعمل</label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                type="email" 
                placeholder="name@company.sa" 
                className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground/30 h-12 rounded-xl focus:ring-primary/20" 
                dir="ltr" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/70 mr-1 font-arabic block">كلمة المرور</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground/30 h-12 rounded-xl pe-10 focus:ring-primary/20" 
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
              <p className="text-[10px] text-muted-foreground font-arabic mt-1 px-1 flex items-center gap-1.5">
                <Check className="w-3 h-3 text-primary" /> لا تقل عن 8 خانات تتضمن أرقام ورموز
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-black rounded-xl transition-all shadow-lg shadow-primary/20 group"
            >
              {loading ? "جاري إنشاء الحساب..." : "تأكيد وإنشاء الحساب"} 
              <ArrowLeft className="w-4 h-4 ms-2 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground font-arabic">
              تملك حساباً بالفعل؟{" "}
              <button onClick={() => navigate("/login")} className="text-primary font-bold hover:brightness-125">تسجيل الدخول</button>
            </p>
          </div>
        </div>

        {/* Security Badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 opacity-40 grayscale hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-foreground uppercase">
            <ShieldCheck className="w-3 h-3 text-primary" />
            PDPL Compliant
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-foreground uppercase border-x border-border/50 px-6">
            <Lock className="w-3 h-3 text-primary" />
            End-to-End Encryption
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-foreground uppercase">
            <Check className="w-3 h-3 text-primary" />
            Saudi Data Center
          </div>
        </div>

        <p className="text-center text-[9px] text-muted-foreground/40 mt-8 font-mono tracking-[0.2em] uppercase">
          SplitTech AI Audit Platform © 2026 · Jeddah, KSA
        </p>
      </motion.div>
    </div>
  );
}