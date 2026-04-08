import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, Lock, CheckCircle2, Loader2, AlertCircle, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// التنبيه: تأكد من استخدام المفتاح الحي (Live Key) عند الإطلاق الرسمي في بيئة الإنتاج
const TAP_PUBLISHABLE_KEY = "pk_test_EtHFV4BuPQokJT6jiROls87Y";

declare global {
  interface Window {
    goSell?: any;
  }
}

const tapErrorMap: Record<string, string> = {
  card_declined: "تم رفض البطاقة، يرجى التحقق من الرصيد أو استخدام بطاقة أخرى",
  insufficient_funds: "الرصيد غير كافٍ لإتمام العملية",
  expired_card: "البطاقة منتهية الصلاحية",
  invalid_card: "بيانات البطاقة غير صحيحة، يرجى التأكد من الأرقام",
  processing_error: "حدث خطأ أثناء المعالجة، يرجى المحاولة مرة أخرى",
  authentication_failed: "فشل التحقق الآمن (3D Secure)، حاول مجدداً",
};

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const tier = searchParams.get("tier") || "pro";
  const subscriptionId = searchParams.get("sub_id") || "";

  // الأسعار النهائية الشاملة للضريبة
  const tierPrices: Record<string, number> = { basic: 299, pro: 499, enterprise: 899 };
  const tierNames: Record<string, string> = { basic: "الأساسية", pro: "الاحترافية", enterprise: "للمؤسسات" };
  
  const totalAmount = tierPrices[tier] || 499; 
  
  // الحساب العكسي للضريبة (15%)
  const priceBeforeVat = Math.round(totalAmount / 1.15);
  const vatAmount = totalAmount - priceBeforeVat;

  useEffect(() => {
    if (document.getElementById("tap-gosell-sdk")) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "tap-gosell-sdk";
    script.src = "https://goSellJSLib.b-cdn.net/v2.0.0/js/gosell.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://goSellJSLib.b-cdn.net/v2.0.0/css/gosell.css";
    document.head.appendChild(link);
  }, []);

  const handlePayment = useCallback(() => {
    if (!sdkReady || !window.goSell || !user) {
      toast.error("جاري تهيئة بوابة الدفع، يرجى الانتظار...");
      return;
    }

    setLoading(true);
    setPaymentError(null);

    window.goSell.config({
      containerID: "tap-payment-container",
      gateway: {
        publicKey: TAP_PUBLISHABLE_KEY,
        merchantId: "599424",
        language: "ar",
        contactInfo: true,
        supportedCurrencies: "SAR",
        supportedPaymentMethods: "all",
        saveCardOption: false,
        customerCards: false,
        notifications: "standard",
        callback: async (response: any) => {
          const cbStatus = response.callback?.status;
          const cbId = response.callback?.id;

          if (cbStatus === "CAPTURED" || cbId) {
            await processPayment(cbId);
          } else if (cbStatus === "FAILED" || cbStatus === "DECLINED") {
            setLoading(false);
            const errMsg = tapErrorMap[response.callback?.response?.code] || "لم تكتمل عملية الدفع، يرجى المحاولة مرة أخرى";
            setPaymentError(errMsg);
            toast.error(errMsg);
          } else {
            setLoading(false);
          }
        },
        onClose: () => setLoading(false),
        labels: {
          cardNumber: "رقم البطاقة",
          expirationDate: "الشهر / السنة",
          cvv: "الرمز السري (CVV)",
          cardHolder: "الاسم المكتوب على البطاقة",
          actionButton: `تأكيد الاشتراك | ${totalAmount} ر.س`,
        },
        style: {
          base: {
            color: "#FFFFFF",
            fontFamily: "Tajawal, sans-serif",
            fontSize: "16px",
            "::placeholder": { color: "#666" },
          },
        },
      },
      customer: {
        email: user.email || "",
        first_name: user.user_metadata?.full_name || "شريك سبلت تيك",
        phone: { country_code: "966", number: "" },
      },
      order: {
        amount: totalAmount,
        currency: "SAR",
        items: [{
          id: tier,
          name: `باقة سبلت تيك ${tierNames[tier]}`,
          amount_per_unit: totalAmount.toString(),
          quantity: "1",
        }],
      },
      transaction: {
        mode: "charge",
        charge: {
          threeDSecure: true,
          description: `SplitTech - ${tierNames[tier]} (Tax Inclusive)`,
          metadata: { user_id: user.id, subscription_id: subscriptionId, tier },
          redirect: `${window.location.origin}/dashboard/payment-success`,
        },
      },
    });

    window.goSell.openLightBox();
  }, [sdkReady, user, totalAmount, tier, subscriptionId]);

  const processPayment = async (chargeId: string) => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-tap-charge", {
        body: { amount: totalAmount, tier, token_id: chargeId, subscription_id: subscriptionId },
      });

      if (error) throw error;
      toast.success("تم تفعيل اشتراكك بنجاح! 🎉");
      navigate("/dashboard/payment-success");
    } catch (err) {
      setPaymentError("حدث خطأ أثناء تأكيد الدفع، يرجى التواصل مع الدعم الفني");
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background carbon-grid relative overflow-hidden" dir="rtl">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-xl mx-auto px-4 py-16 z-10 relative">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mb-6 shadow-xl">
            <CreditCard className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-foreground font-arabic mb-3">إتمام عملية الدفع</h1>
          <p className="text-muted-foreground font-arabic">باقة {tierNames[tier]} — السعر شامل ضريبة القيمة المضافة</p>
        </motion.div>

        <div className="grid gap-6">
          {/* ملخص الفاتورة (شامل الضريبة) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-strong rounded-[2.5rem] p-8 border border-border/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-foreground font-arabic">ملخص الاشتراك</h3>
              <span className="text-[10px] bg-secondary px-3 py-1 rounded-full text-muted-foreground font-mono tracking-widest uppercase">ST-SECURE</span>
            </div>
            
            <div className="space-y-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-arabic">قيمة الباقة (قبل الضريبة)</span>
                <span className="font-bold text-foreground">{priceBeforeVat.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-arabic">ضريبة القيمة المضافة (15%)</span>
                <span className="font-bold text-foreground">{vatAmount.toLocaleString()} ر.س</span>
              </div>
              
              <div className="border-t border-border/50 pt-6 flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-primary font-bold uppercase mb-1 tracking-tighter">Total Tax Inclusive</p>
                  <p className="text-4xl font-black text-foreground leading-none">{totalAmount.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">ر.س</span></p>
                </div>
                <div className="text-left">
                  <span className="text-[10px] bg-emerald/10 text-emerald border border-emerald/20 px-3 py-1 rounded-full font-arabic font-bold">
                    السعر شامل الضريبة
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* بوابة الدفع */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong rounded-[2.5rem] p-8 border border-primary/20 relative">
            <div id="tap-payment-container" className="mb-4 min-h-[50px]" />
            
            {paymentError && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-bold font-arabic leading-relaxed">{paymentError}</p>
              </div>
            )}

            <Button
              onClick={handlePayment}
              disabled={loading || verifying || !sdkReady}
              className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-black text-lg rounded-2xl shadow-xl shadow-primary/20 group transition-all"
            >
              {verifying ? (
                <><Loader2 className="w-5 h-5 me-2 animate-spin" /> جاري التوثيق...</>
              ) : (
                <><Lock className="w-5 h-5 me-2" /> ادفع {totalAmount} ر.س آمن</>
              )}
            </Button>

            <div className="mt-8 flex items-center justify-center gap-5 border-t border-border/50 pt-6 grayscale opacity-40">
              <img src="https://img.icons8.com/color/48/000000/visa.png" className="h-6" alt="Visa" />
              <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="h-6" alt="Mastercard" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Mada_Logo.svg" className="h-4" alt="Mada" />
              <img src="https://img.icons8.com/color/48/000000/apple-pay.png" className="h-8" alt="Apple Pay" />
            </div>
          </motion.div>

          {/* شارات الثقة */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-secondary/30 rounded-2xl p-4 text-center border border-border/50">
              <ShieldCheck className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-[9px] font-bold text-muted-foreground font-arabic uppercase">تشفير AES-256</p>
            </div>
            <div className="bg-secondary/30 rounded-2xl p-4 text-center border border-border/50">
              <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-[9px] font-bold text-muted-foreground font-arabic uppercase">توثيق مالي</p>
            </div>
            <div className="bg-secondary/30 rounded-2xl p-4 text-center border border-border/50">
              <Info className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-[9px] font-bold text-muted-foreground font-arabic uppercase">دعم محلي</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[9px] text-muted-foreground/30 mt-10 font-mono tracking-[0.3em] uppercase">
          SplitTech AI Audit Platform · PCI-DSS Secure Gateway
        </p>
      </div>
    </div>
  );
}