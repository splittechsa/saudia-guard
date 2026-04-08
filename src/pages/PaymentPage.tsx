import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Shield, Lock, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TAP_PUBLISHABLE_KEY = "pk_test_EtHFV4BuPQokJT6jiROls87Y";

declare global {
  interface Window {
    goSell?: any;
  }
}

const tapErrorMap: Record<string, string> = {
  card_declined: "البطاقة مرفوضة — يرجى استخدام بطاقة أخرى",
  insufficient_funds: "رصيد غير كافي في البطاقة",
  expired_card: "البطاقة منتهية الصلاحية",
  invalid_card: "رقم البطاقة غير صحيح",
  processing_error: "خطأ في معالجة الدفع — حاول مرة أخرى",
  authentication_failed: "فشل التحقق ثلاثي الأبعاد (3D Secure)",
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

  const tierPrices: Record<string, number> = { basic: 299, pro: 499, enterprise: 899 };
  const tierNames: Record<string, string> = { basic: "أساسي", pro: "احترافي", enterprise: "مؤسسي" };
  const price = tierPrices[tier] || 499;

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
      toast.error("نظام الدفع غير جاهز، يرجى الانتظار");
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
        backgroundImg: { url: "", opacity: "0.5" },
        callback: async (response: any) => {
          console.log("Tap callback:", response);
          const cbStatus = response.callback?.status;
          const cbId = response.callback?.id;

          if (cbStatus === "CAPTURED" || cbId) {
            await processPayment(cbId);
          } else if (cbStatus === "FAILED" || cbStatus === "DECLINED") {
            setLoading(false);
            const errMsg = tapErrorMap[response.callback?.response?.code] || "فشل الدفع — يرجى المحاولة مرة أخرى";
            setPaymentError(errMsg);
            toast.error(errMsg);
          } else if (cbStatus === "CANCELLED" || cbStatus === "VOIDED") {
            setLoading(false);
            setPaymentError("تم إلغاء عملية الدفع");
            toast.error("تم إلغاء عملية الدفع");
          } else {
            setLoading(false);
            toast.error("فشل الدفع، يرجى المحاولة مرة أخرى");
          }
        },
        onClose: () => {
          setLoading(false);
        },
        labels: {
          cardNumber: "رقم البطاقة",
          expirationDate: "تاريخ الانتهاء",
          cvv: "CVV",
          cardHolder: "اسم حامل البطاقة",
          actionButton: `ادفع ${Math.round(price * 1.15)} ر.س`,
        },
        style: {
          base: {
            color: "#E0E0E0",
            lineHeight: "18px",
            fontFamily: "Noto Kufi Arabic, sans-serif",
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": { color: "#999", fontSize: "14px" },
          },
          invalid: { color: "#ef4444" },
        },
      },
      customer: {
        email: user.email || "",
        first_name: user.user_metadata?.full_name || "Customer",
        last_name: "",
        phone: { country_code: "966", number: "" },
      },
      order: {
        amount: price,
        currency: "SAR",
        items: [
          {
            id: tier,
            name: `اشتراك ${tierNames[tier]}`,
            description: `خطة ${tierNames[tier]} الشهرية`,
            quantity: "1",
            amount_per_unit: price.toString(),
          },
        ],
      },
      transaction: {
        mode: "charge",
        charge: {
          saveCard: false,
          threeDSecure: true,
          description: `Split Tech - ${tierNames[tier]}`,
          metadata: { user_id: user.id, subscription_id: subscriptionId, tier },
          receipt: { email: true, sms: false },
          redirect: `${window.location.origin}/dashboard/payment-success`,
          post: null,
        },
      },
    });

    window.goSell.openLightBox();
  }, [sdkReady, user, price, tier, subscriptionId]);

  const processPayment = async (chargeId: string) => {
    setVerifying(true);
    setPaymentError(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-tap-charge", {
        body: {
          amount: price,
          currency: "SAR",
          tier,
          token_id: chargeId,
          subscription_id: subscriptionId,
        },
      });

      if (error) throw error;

      if (data?.status === "CAPTURED" || data?.redirect_url) {
        toast.success("تم الدفع بنجاح! 🎉");
        navigate("/dashboard/payment-success");
      } else if (data?.redirect_url) {
        window.location.href = data.redirect_url;
      } else if (data?.error) {
        setPaymentError(data.error);
        toast.error(data.error);
      } else {
        navigate("/dashboard/payment-success");
      }
    } catch (err: any) {
      console.error("Payment processing error:", err);
      setPaymentError("حدث خطأ في معالجة الدفع — يرجى المحاولة لاحقاً");
      toast.error("حدث خطأ في معالجة الدفع");
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background carbon-grid relative overflow-hidden" dir="rtl">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-lg mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <CreditCard className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-arabic">إتمام الدفع</h1>
          <p className="text-sm text-muted-foreground mt-2 font-arabic">
            اشتراك {tierNames[tier]} — {price} ر.س/شهرياً
          </p>
        </motion.div>

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl bg-card border border-border p-6 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 font-arabic">ملخص الطلب</h3>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground font-arabic">خطة {tierNames[tier]}</span>
            <span className="text-sm font-bold text-foreground">{price} ر.س</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground font-arabic">ضريبة القيمة المضافة (15%)</span>
            <span className="text-sm font-bold text-foreground">{Math.round(price * 0.15)} ر.س</span>
          </div>
          <div className="border-t border-border my-3" />
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-foreground font-arabic">الإجمالي</span>
            <span className="text-lg font-bold text-primary">{Math.round(price * 1.15)} ر.س</span>
          </div>
        </motion.div>

        {/* Error Banner */}
        {paymentError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive font-arabic">{paymentError}</p>
          </motion.div>
        )}

        {/* Payment Container */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-card border border-border p-6 mb-6">
          <div id="tap-payment-container" className="min-h-[60px]" />
          <Button
            onClick={handlePayment}
            disabled={loading || verifying || !sdkReady}
            className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 font-arabic h-12 text-base"
          >
            {verifying ? (
              <><Loader2 className="w-5 h-5 me-2 animate-spin" /> جاري التحقق...</>
            ) : loading ? (
              <><Loader2 className="w-5 h-5 me-2 animate-spin" /> جاري المعالجة...</>
            ) : (
              <><Lock className="w-4 h-4 me-2" /> ادفع {Math.round(price * 1.15)} ر.س</>
            )}
          </Button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-1.5 text-xs font-arabic">
            <Shield className="w-3.5 h-3.5 text-emerald" /><span>دفع آمن</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-arabic">
            <Lock className="w-3.5 h-3.5 text-primary" /><span>تشفير SSL</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-arabic">
            <CheckCircle className="w-3.5 h-3.5 text-accent" /><span>PCI DSS</span>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-muted-foreground mt-4 font-arabic">
          بيئة اختبار — لا يتم خصم مبالغ فعلية
        </p>
      </div>
    </div>
  );
}
