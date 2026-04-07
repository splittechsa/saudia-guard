import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, UserPlus } from "lucide-react";
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
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background carbon-grid relative overflow-hidden" dir="rtl">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-4">
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
            <img src={splitLogo} alt="Split Tech" className="w-10 h-10" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">إنشاء حساب جديد</h1>
          <p className="text-sm text-muted-foreground mt-1">انضم إلى منصة Split Tech</p>
        </div>

        <div className="glass-strong rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-semibold">تاجر جديد</span>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">الاسم الكامل</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="أحمد محمد" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-11" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">البريد الإلكتروني</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="merchant@example.com" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-11" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">كلمة المرور</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-11 pe-10" dir="ltr" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-lime">
              {loading ? "جاري الإنشاء..." : "إنشاء حساب"} <ArrowLeft className="w-4 h-4 ms-2" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">تسجيل الدخول</button>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6 font-mono">
          SPLIT TECH — ENCRYPTED · SAUDI DATA RESIDENCY · PDPL COMPLIANT
        </p>
      </motion.div>
    </div>
  );
}
