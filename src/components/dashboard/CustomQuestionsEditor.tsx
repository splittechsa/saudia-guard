import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Trash2, Save, GripVertical, MessageSquareText, 
  CheckCircle2, XCircle, Clock, AlertCircle, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ... (نفس الـ Interfaces السابقة)

export function CustomQuestionsEditor({ storeId, initialQueries, queryStatus, isAdmin = false, onSave }: Props) {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [saving, setSaving] = useState(false);

  // ... (نفس منطق الـ useEffect والـ Handlers السابقة مع تحسينات طفيفة)

  const approvedCount = questions.filter(q => q.status === "approved").length;
  const pendingCount = questions.filter(q => q.status === "pending").length;

  return (
    <div className="glass-strong rounded-[2rem] border border-border p-8 space-y-6 relative overflow-hidden" dir="rtl">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
            <MessageSquareText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground font-arabic tracking-tight">معايير التدقيق المخصصة</h3>
            <p className="text-xs text-muted-foreground font-arabic">حدد الأسئلة التي سيقوم المحرك بتحليلها</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald/10 text-emerald border-emerald/20 px-3 py-1 rounded-lg font-bold font-arabic">
            <CheckCircle2 className="w-3 h-3 ml-1.5" /> {approvedCount} مفعّل
          </Badge>
          {pendingCount > 0 && (
            <Badge className="bg-accent/10 text-accent border-accent/20 px-3 py-1 rounded-lg font-bold font-arabic">
              <Clock className="w-3 h-3 ml-1.5 animate-pulse" /> {pendingCount} معلق
            </Badge>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-1 relative z-10">
        <AnimatePresence initial={false}>
          {questions.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center space-y-3 opacity-20 border-2 border-dashed border-border rounded-3xl">
               <Sparkles className="w-10 h-10 mx-auto" />
               <p className="text-sm font-bold font-arabic">لم يتم إضافة أي أسئلة بعد</p>
            </motion.div>
          ) : (
            questions.map((q, i) => (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group flex items-center gap-4 rounded-2xl border p-4 transition-all hover:shadow-lg ${
                  q.status === "approved" ? "bg-emerald/[0.02] border-emerald/20" :
                  q.status === "rejected" ? "bg-destructive/[0.02] border-destructive/20" :
                  "bg-accent/[0.02] border-accent/20"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab" />
                  <span className="text-xs font-black font-mono text-muted-foreground/40 w-6">{String(i + 1).padStart(2, '0')}</span>
                  <Input
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm font-bold font-arabic h-8 p-0 focus-visible:ring-0 shadow-none text-foreground"
                    placeholder="اكتب المعيار هنا..."
                  />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isAdmin ? (
                    <div className="flex items-center bg-background/50 p-1 rounded-xl border border-border">
                      <button
                        onClick={() => toggleStatus(q.id)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black font-arabic transition-all ${
                          q.status === "approved" ? "bg-emerald text-white shadow-lg shadow-emerald/20" :
                          q.status === "rejected" ? "bg-destructive text-white" :
                          "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {q.status === "approved" ? "معتمد" : q.status === "rejected" ? "مرفوض" : "اعتماد؟"}
                      </button>
                    </div>
                  ) : (
                    <div className={`p-1.5 rounded-lg border ${
                      q.status === "approved" ? "text-emerald border-emerald/20 bg-emerald/5" :
                      q.status === "rejected" ? "text-destructive border-destructive/20 bg-destructive/5" :
                      "text-accent border-accent/20 bg-accent/5"
                    }`}>
                       {q.status === "approved" ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                        q.status === "rejected" ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>
                  )}
                  
                  <button 
                    onClick={() => removeQuestion(q.id)} 
                    className="p-2 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add New Question Section */}
      <div className="pt-4 border-t border-border/50 relative z-10">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addQuestion()}
              placeholder="مثال: هل يرتدي الموظف القفازات؟"
              className="h-12 rounded-2xl bg-secondary/50 border-border font-arabic pr-4 focus:border-primary/50 transition-all"
            />
          </div>
          <Button 
            onClick={addQuestion} 
            className="h-12 px-6 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/10 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        
        {!isAdmin && pendingCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mt-4 text-[10px] text-accent bg-accent/5 p-2 rounded-xl border border-accent/10 font-arabic">
             <AlertCircle className="w-3 h-3" />
             <span>سيتم تفعيل الأسئلة المضافة حديثاً فور مراجعتها من قبل فريق الجودة (خلال ساعة).</span>
          </motion.div>
        )}
      </div>

      <Button 
        onClick={handleSave} 
        disabled={saving} 
        className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 font-black text-lg rounded-2xl shadow-xl transition-all relative overflow-hidden group"
      >
        <div className="relative z-10 flex items-center justify-center gap-2">
           <Save className="w-5 h-5" /> 
           {saving ? "جاري مزامنة القوانين..." : "حفظ وتفعيل معايير الذكاء"}
        </div>
        {/* Shine animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </Button>

      <p className="text-center text-[9px] text-muted-foreground/30 font-mono tracking-[0.3em] uppercase">
        SplitTech Core · Question Validation Logic v3.2
      </p>
    </div>
  );
}