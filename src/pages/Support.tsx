import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Clock, AlertCircle, CheckCircle, Loader2, 
  MessageSquare, LifeBuoy, Send, ShieldQuestion, Headphones 
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import TicketChat from "@/components/tickets/TicketChat";

// ... (نفس الـ Interfaces والـ PriorityColors السابقة)

export default function Support() {
  const { t } = useTranslation();
  const { user } = useAuth();
  // ... (نفس الـ States السابقة)

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 py-4" dir="rtl">
        
        {/* Header - هوية مركز الدعم */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
               <Headphones className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground font-arabic tracking-tight">مركز العناية بالشركاء</h1>
              <p className="text-sm text-muted-foreground font-arabic mt-1">نحن هنا لضمان عمل ذكاء متجرك بأعلى كفاءة</p>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs bg-secondary/50 px-4 py-2 rounded-xl border border-border">
             <span className="text-muted-foreground tracking-widest uppercase">Direct Email:</span>
             <span className="text-primary font-bold">info@splittech.sa</span>
          </div>
        </motion.div>

        {/* Action Bar */}
        <div className="flex justify-between items-center bg-card/30 p-4 rounded-2xl border border-border/50">
           <h3 className="text-sm font-bold text-foreground font-arabic flex items-center gap-2">
              <ShieldQuestion className="w-4 h-4 text-primary" /> تذاكر الدعم الفني
           </h3>
           <Button 
             onClick={() => setShowForm(!showForm)} 
             className="bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
           >
              {showForm ? "إغلاق النموذج" : "فتح تذكرة جديدة"} 
              <Plus className="w-4 h-4 ms-2" />
           </Button>
        </div>

        {/* New Ticket Form - بأسلوب سبلت تيك الفخم */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto" }} 
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-strong rounded-[2rem] border border-primary/20 p-8 space-y-6 shadow-2xl relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground font-arabic mr-1">موضوع التذكرة</label>
                      <Input
                        placeholder="مثال: مشكلة في ربط الكاميرا رقم 2"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="h-12 rounded-xl bg-secondary/50 border-border font-arabic"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground font-arabic mr-1">الأولوية</label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-border font-arabic">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                          <SelectItem value="low" className="font-arabic italic">عادية - استفسارات</SelectItem>
                          <SelectItem value="medium" className="font-arabic font-bold">متوسطة - مشكلة تشغيلية</SelectItem>
                          <SelectItem value="high" className="font-arabic text-destructive font-black">عاجلة - توقف الخدمة</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-muted-foreground font-arabic mr-1">وصف تفصيلي للمشكلة</label>
                   <Textarea
                     placeholder="يرجى كتابة التفاصيل لمساعدتنا في حل المشكلة بشكل أسرع..."
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     rows={5}
                     className="rounded-2xl bg-secondary/50 border-border font-arabic resize-none"
                   />
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting || !subject.trim()} 
                    className="h-12 px-10 bg-primary text-primary-foreground font-black rounded-xl shadow-xl shadow-primary/20 group"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Send className="w-5 h-5 me-2 group-hover:-translate-y-1 transition-transform" />}
                    إرسال التذكرة الآن
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tickets List */}
        <div className="grid gap-4">
          {tickets.length === 0 ? (
            <div className="glass-strong rounded-[2.5rem] py-20 text-center border border-dashed border-border">
              <div className="w-16 h-16 bg-secondary rounded-3xl mx-auto mb-6 flex items-center justify-center opacity-20">
                 <LifeBuoy className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-arabic">لا توجد تذاكر نشطة</h3>
              <p className="text-sm text-muted-foreground font-arabic">جميع طلباتك السابقة مغلقة أو لم تقم بإنشاء تذكرة بعد.</p>
            </div>
          ) : (
            tickets.map((ticket, i) => {
              const StatusIcon = statusIcons[ticket.status] || AlertCircle;
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedTicket(ticket)}
                  className="group glass-strong rounded-3xl border border-border p-6 hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-xl relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-background border border-border ${ticket.status === 'resolved' ? 'text-emerald' : 'text-primary'}`}>
                           <StatusIcon className={`w-4 h-4 ${ticket.status === 'in_progress' ? 'animate-spin' : ''}`} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground font-arabic group-hover:text-primary transition-colors tracking-tight">
                           {ticket.subject}
                        </h3>
                        <Badge variant="outline" className="text-[9px] font-mono tracking-widest opacity-40">#{ticket.id.slice(0, 8)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-arabic leading-relaxed line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center gap-4 pt-2">
                         <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-arabic">
                            <Clock className="w-3 h-3" />
                            {new Date(ticket.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                         </div>
                         <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold font-arabic">
                            <MessageSquare className="w-3 h-3" /> محادثة نشطة
                         </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-2 items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-r border-border/50 pt-4 md:pt-0 md:pr-6">
                       <Badge className={`px-4 py-1 rounded-lg text-[10px] font-bold font-arabic border-none ${priorityColors[ticket.priority]}`}>
                          أولوية {getPriorityLabel(ticket.priority)}
                       </Badge>
                       <Badge variant="outline" className="px-4 py-1 rounded-lg text-[10px] font-bold font-arabic bg-secondary/50">
                          {getStatusLabel(ticket.status)}
                       </Badge>
                    </div>
                  </div>
                  {/* الديكور الجمالي في الزاوية */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform" />
                </motion.div>
              );
            })
          )}
        </div>

        {selectedTicket && (
          <TicketChat
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            senderRole="merchant"
          />
        )}

        <footer className="text-center pt-12 pb-8 opacity-20 pointer-events-none font-mono text-[9px] tracking-[0.3em] uppercase">
          SplitTech Care System · 24/7 Monitoring · Jeddah HQ
        </footer>
      </div>
    </DashboardLayout>
  );
}