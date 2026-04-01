import { useState, useEffect } from "react";
import { Plus, Trash2, Save, GripVertical, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomQuestion {
  id: string;
  question: string;
  status: "approved" | "pending" | "rejected";
}

interface Props {
  storeId: string;
  initialQueries: any;
  queryStatus: string;
  isAdmin?: boolean; // IT/Owner can approve/reject
  onSave?: () => void;
}

export function CustomQuestionsEditor({ storeId, initialQueries, queryStatus, isAdmin = false, onSave }: Props) {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = initialQueries || [];
    if (Array.isArray(raw)) {
      if (raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null) {
        setQuestions(raw.map((q: any, i: number) => ({
          id: q.id || `q-${i}`,
          question: q.question || q,
          status: q.status || "approved",
        })));
      } else {
        setQuestions(raw.map((q: string, i: number) => ({
          id: `q-${i}`,
          question: String(q),
          status: queryStatus === "approved" ? "approved" : "pending",
        })));
      }
    }
  }, [initialQueries, queryStatus]);

  const addQuestion = () => {
    const text = newQuestion.trim();
    if (!text) return;
    if (questions.length >= 20) { toast.error("الحد الأقصى 20 سؤال"); return; }
    setQuestions(prev => [...prev, {
      id: `q-${Date.now()}`,
      question: text,
      status: isAdmin ? "approved" : "pending",
    }]);
    setNewQuestion("");
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, question: text, status: isAdmin ? q.status : "pending" as const } : q));
  };

  const toggleStatus = (id: string) => {
    if (!isAdmin) return;
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, status: q.status === "approved" ? "rejected" : "approved" } : q));
  };

  const handleSave = async () => {
    setSaving(true);
    const allApproved = questions.every(q => q.status === "approved");
    const { error } = await supabase.from("stores").update({
      custom_queries: questions.map(q => ({ id: q.id, question: q.question, status: q.status })) as any,
      query_status: allApproved ? "approved" : "pending",
    }).eq("id", storeId);

    if (error) toast.error("فشل حفظ الأسئلة");
    else {
      toast.success("تم حفظ الأسئلة بنجاح");
      onSave?.();
    }
    setSaving(false);
  };

  const approvedCount = questions.filter(q => q.status === "approved").length;
  const pendingCount = questions.filter(q => q.status === "pending").length;

  return (
    <div className="rounded-xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground font-arabic">أسئلة التدقيق</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] text-emerald border-emerald/30 font-arabic">
            {approvedCount} مفعّل
          </Badge>
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-[10px] text-accent border-accent/30 font-arabic">
              {pendingCount} بانتظار الموافقة
            </Badge>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {questions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4 font-arabic">لا توجد أسئلة — أضف أسئلة ليتم تدقيقها بالذكاء الاصطناعي</p>
        )}
        {questions.map((q, i) => (
          <div key={q.id} className={`flex items-center gap-2 rounded-lg border p-3 transition-all ${
            q.status === "approved" ? "bg-emerald/5 border-emerald/20" :
            q.status === "rejected" ? "bg-destructive/5 border-destructive/20" :
            "bg-accent/5 border-accent/20"
          }`}>
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground font-mono w-5 shrink-0">{i + 1}</span>
            <Input
              value={q.question}
              onChange={(e) => updateQuestion(q.id, e.target.value)}
              className="flex-1 bg-transparent border-none text-sm font-arabic h-8 p-0 focus-visible:ring-0"
              dir="rtl"
            />
            {isAdmin && (
              <button
                onClick={() => toggleStatus(q.id)}
                className={`text-[9px] px-2 py-1 rounded-md font-arabic transition-colors ${
                  q.status === "approved" ? "bg-emerald/20 text-emerald hover:bg-emerald/30" :
                  q.status === "rejected" ? "bg-destructive/20 text-destructive hover:bg-destructive/30" :
                  "bg-accent/20 text-accent hover:bg-accent/30"
                }`}
              >
                {q.status === "approved" ? "مفعّل" : q.status === "rejected" ? "مرفوض" : "معلّق"}
              </button>
            )}
            {!isAdmin && (
              <Badge variant="outline" className={`text-[9px] shrink-0 ${
                q.status === "approved" ? "text-emerald border-emerald/30" :
                q.status === "rejected" ? "text-destructive border-destructive/30" :
                "text-accent border-accent/30"
              }`}>
                {q.status === "approved" ? "مفعّل" : q.status === "rejected" ? "مرفوض" : "بانتظار"}
              </Badge>
            )}
            <button onClick={() => removeQuestion(q.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Question */}
      <div className="flex gap-2">
        <Input
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addQuestion()}
          placeholder="أضف سؤال جديد... مثال: هل الموظفون ملتزمون بالزي؟"
          className="flex-1 bg-secondary border-border text-sm font-arabic"
          dir="rtl"
        />
        <Button size="sm" variant="outline" onClick={addQuestion} className="shrink-0 gap-1">
          <Plus className="w-3.5 h-3.5" /> إضافة
        </Button>
      </div>

      {!isAdmin && pendingCount > 0 && (
        <p className="text-[10px] text-accent font-arabic">
          ⓘ الأسئلة الجديدة/المعدّلة تحتاج موافقة الإدارة قبل تفعيلها في التدقيق
        </p>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full font-arabic gap-2">
        <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ الأسئلة"}
      </Button>
    </div>
  );
}
