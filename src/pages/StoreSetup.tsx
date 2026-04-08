import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Wifi, Save, Eye, EyeOff, Send, CalendarDays, CheckCircle2, AlertCircle, Info, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CameraGuide } from "@/components/dashboard/CameraGuide";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ... (نفس الـ Interfaces والـ Regex السابقة)

export default function StoreSetup() {
  // ... (نفس الـ States والـ Handlers السابقة)

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 py-4" dir="rtl">
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-black text-foreground font-arabic tracking-tight">إعداد الكاميرات والربط التقني</h1>
            <p className="text-sm text-muted-foreground font-arabic mt-1 flex items-center gap-2">
               <Info className="w-4 h-4 text-primary" />
               قم بتهيئة بث RTSP لربط متجرك بمحرك الذكاء الاصطناعي
            </p>
          </div>
        </motion.div>

        {stores.length === 0 ? (
          <div className="glass-strong rounded-[2.5rem] border border-border p-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-secondary mx-auto mb-6 flex items-center justify-center opacity-20">
               <Camera className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground font-arabic">لا توجد متاجر نشطة</h3>
            <p className="text-sm text-muted-foreground font-arabic mt-2">يرجى إتمام عملية الاشتراك أولاً لإضافة متاجرك.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* القائمة الجانبية للمتاجر */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">مواقعك المسجلة</h3>
              <div className="space-y-3">
                {stores.map((store) => {
                  const st = storeStatusLabel(store.store_status);
                  const isSelected = selectedStore?.id === store.id;
                  return (
                    <button
                      key={store.id}
                      onClick={() => selectStore(store)}
                      className={`group w-full text-right p-5 rounded-3xl border transition-all relative overflow-hidden ${
                        isSelected ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" : "bg-card border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex flex-col gap-3 relative z-10">
                        <div className="flex justify-between items-start">
                           <Badge variant="outline" className={`text-[8px] font-bold font-arabic px-2 py-0.5 rounded-lg ${st.color}`}>
                             {st.label}
                           </Badge>
                           {isSelected && <ChevronRight className="w-4 h-4 text-primary" />}
                        </div>
                        <div>
                           <p className="text-sm font-black text-foreground font-arabic">{store.name}</p>
                           <p className="text-[9px] text-muted-foreground font-mono mt-1 opacity-60">ID: {store.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* تفاصيل الإعداد */}
            <div className="lg:col-span-3 space-y-6">
              <AnimatePresence mode="wait">
                {selectedStore && (
                  <motion.div key={selectedStore.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    
                    {/* Status Display Card */}
                    <div className="glass-strong rounded-[2.5rem] p-8 border border-border flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                       <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl ${
                             selectedStore.store_status === 'active' ? 'bg-emerald/10 text-emerald' : 'bg-primary/10 text-primary'
                          }`}>
                             <Wifi className={`w-7 h-7 ${selectedStore.store_status === 'active' ? 'animate-pulse' : ''}`} />
                          </div>
                          <div>
                             <h2 className="text-2xl font-black text-foreground font-arabic">{selectedStore.name}</h2>
                             <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-arabic">
                                <span>{selectedStore.hardware_choice || "ربط سحابي (Cloud)"}</span>
                                <span>•</span>
                                <span className={storeStatusLabel(selectedStore.store_status).color}>{storeStatusLabel(selectedStore.store_status).label}</span>
                             </div>
                          </div>
                       </div>
                       
                       {selectedStore.store_status === "draft" && (
                         <Button onClick={handleSubmitForReview} className="bg-primary text-primary-foreground font-black px-8 py-6 rounded-2xl shadow-xl shadow-primary/20 group">
                            إرسال للتحقق التقني <Send className="w-4 h-4 ms-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                         </Button>
                       )}
                    </div>

                    {/* IT Rejection Notice */}
                    {selectedStore.it_review_notes && selectedStore.store_status === "draft" && (
                      <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-[2rem] flex gap-4">
                         <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
                         <div>
                            <p className="text-sm font-bold text-destructive font-arabic mb-1">تحديث مطلوب من الفريق التقني</p>
                            <p className="text-sm text-foreground font-arabic opacity-80">{selectedStore.it_review_notes}</p>
                         </div>
                      </div>
                    )}

                    {/* RTSP Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-strong rounded-[2.5rem] p-8 border border-border space-y-6 md:col-span-2">
                           <div className="flex items-center justify-between">
                              <h3 className="text-lg font-bold text-foreground font-arabic flex items-center gap-2">
                                <Camera className="w-5 h-5 text-primary" /> تفاصيل بث الكاميرا (RTSP)
                              </h3>
                              <Badge variant="secondary" className="text-[9px] font-mono">ENCRYPTED STREAM</Badge>
                           </div>
                           
                           <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground mr-1 font-arabic">رابط البث (RTSP URL)</Label>
                                <Input 
                                  value={rtspUrl} 
                                  onChange={(e) => setRtspUrl(e.target.value)}
                                  placeholder="rtsp://IP:PORT/stream_path" 
                                  className="h-14 rounded-2xl bg-secondary/50 border-border text-foreground font-mono text-sm"
                                  dir="ltr"
                                  disabled={selectedStore.store_status === "active"}
                                />
                                <p className="text-[10px] text-muted-foreground px-2 font-arabic">تأكد من فتح بورت الكاميرا (عادة 554) في الراوتر الخاص بك.</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground mr-1 font-arabic">اسم المستخدم</Label>
                                    <Input value={camUser} onChange={(e) => setCamUser(e.target.value)} className="h-12 rounded-xl bg-secondary/30" dir="ltr" disabled={selectedStore.store_status === "active"} />
                                 </div>
                                 <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground mr-1 font-arabic">كلمة المرور</Label>
                                    <div className="relative">
                                        <Input 
                                          type={showPass ? "text" : "password"} 
                                          value={camPass} 
                                          onChange={(e) => setCamPass(e.target.value)} 
                                          className="h-12 rounded-xl bg-secondary/30 pe-10" 
                                          dir="ltr" 
                                          disabled={selectedStore.store_status === "active"}
                                        />
                                        <button onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {selectedStore.store_status !== "active" && (
                              <div className="flex justify-end pt-4">
                                 <Button variant="outline" onClick={handleSave} disabled={saving} className="rounded-xl font-bold font-arabic px-10">
                                    <Save className="w-4 h-4 me-2" /> حفظ المسودة
                                 </Button>
                              </div>
                           )}
                        </div>

                        {/* مراحل التفعيل - التوضيح البصري */}
                        <div className="glass-strong rounded-[2.5rem] p-8 border border-border">
                           <h3 className="text-sm font-black text-foreground font-arabic mb-6 uppercase tracking-wider">مراحل ربط المتجر</h3>
                           <div className="space-y-6">
                              {[
                                { step: 1, label: "توفير رابط البث", done: !!selectedStore.rtsp_url },
                                { step: 2, label: "المراجعة التقنية", done: selectedStore.store_status !== "draft" },
                                { step: 3, label: "اعتماد سبلت تيك", done: selectedStore.store_status === "active" },
                                { step: 4, label: "بدء تحليل البيانات", done: selectedStore.store_status === "active" && selectedStore.is_active },
                              ].map((s) => (
                                <div key={s.step} className="flex items-center gap-4 relative">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm z-10 ${
                                    s.done ? "bg-emerald text-white" : "bg-secondary text-muted-foreground"
                                  }`}>
                                    {s.done ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                                  </div>
                                  <span className={`text-sm font-bold font-arabic ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                                  {s.step < 4 && <div className={`absolute left-4 top-8 w-0.5 h-6 ${s.done ? 'bg-emerald/30' : 'bg-border'}`} />}
                                </div>
                              ))}
                           </div>
                        </div>

                        {/* الدعم التقني */}
                        <div className="glass-strong rounded-[2.5rem] p-8 border border-accent/20 bg-accent/[0.02] flex flex-col justify-between">
                           <div>
                              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                                 <CalendarDays className="w-6 h-6" />
                              </div>
                              <h3 className="text-lg font-bold text-foreground font-arabic">المساعدة الفنية</h3>
                              <p className="text-xs text-muted-foreground font-arabic mt-2 leading-relaxed">
                                ندرك أن إعدادات الـ RTSP قد تكون معقدة. فريقنا التقني جاهز لمساعدتك في ربط كاميراتك عن بُعد.
                              </p>
                           </div>
                           <Button 
                             onClick={() => navigate("/dashboard/book-appointment")} 
                             className="w-full mt-6 bg-accent text-white hover:bg-accent/90 rounded-2xl font-bold font-arabic h-12"
                           >
                              حجز جلسة ربط تقني
                           </Button>
                        </div>
                    </div>

                    <CameraGuide storeId={selectedStore.id} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <footer className="text-center pt-12 pb-8 opacity-20 pointer-events-none font-mono text-[9px] tracking-[0.3em] uppercase">
          SplitTech Infrastructure · RTSP Secure Gateway · Jeddah HQ
        </footer>
      </div>
    </DashboardLayout>
  );
}