import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Plus, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

const priorityColors: Record<string, string> = {
  low: "bg-emerald/20 text-emerald border-emerald/30",
  medium: "bg-accent/20 text-accent border-accent/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusIcons: Record<string, typeof Clock> = {
  open: AlertCircle,
  in_progress: Loader2,
  resolved: CheckCircle,
  closed: CheckCircle,
};

export default function Support() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTickets(data as Ticket[]);
  };

  const handleSubmit = async () => {
    if (!user || !subject.trim() || !description.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject,
      description,
      priority,
    });
    setSubmitting(false);
    if (error) {
      toast.error("حدث خطأ أثناء إرسال التذكرة");
      return;
    }
    toast.success("تم إرسال التذكرة بنجاح");
    setShowForm(false);
    setSubject("");
    setDescription("");
    setPriority("medium");
    fetchTickets();
  };

  const getPriorityLabel = (p: string) => {
    const map: Record<string, string> = { low: t("support.priority_low"), medium: t("support.priority_medium"), high: t("support.priority_high") };
    return map[p] || p;
  };

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = { open: t("support.status_open"), in_progress: t("support.status_in_progress"), resolved: t("support.status_resolved"), closed: t("support.status_closed") };
    return map[s] || s;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-arabic">{t("support.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1 font-arabic">splittechsa@outlook.com</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground font-arabic">
            <Plus className="w-4 h-4 me-2" /> {t("support.new_ticket")}
          </Button>
        </motion.div>

        {/* New Ticket Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card border border-border p-6 space-y-4">
            <Input
              placeholder={t("support.subject")}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="font-arabic"
            />
            <Textarea
              placeholder={t("support.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="font-arabic"
            />
            <div className="flex items-center gap-4">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-48 font-arabic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="font-arabic">{t("support.priority_low")}</SelectItem>
                  <SelectItem value="medium" className="font-arabic">{t("support.priority_medium")}</SelectItem>
                  <SelectItem value="high" className="font-arabic">{t("support.priority_high")}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSubmit} disabled={submitting || !subject.trim()} className="bg-primary text-primary-foreground font-arabic">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                {t("support.submit")}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Tickets List */}
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-arabic">
              {t("support.no_tickets")}
            </div>
          ) : (
            tickets.map((ticket, i) => {
              const StatusIcon = statusIcons[ticket.status] || AlertCircle;
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl bg-card border border-border p-5 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon className={`w-4 h-4 ${ticket.status === 'resolved' ? 'text-emerald' : ticket.status === 'in_progress' ? 'text-accent animate-spin' : 'text-muted-foreground'}`} />
                        <h3 className="text-sm font-bold text-foreground font-arabic">{ticket.subject}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground font-arabic line-clamp-2">{ticket.description}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">
                        {new Date(ticket.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant="outline" className={`text-[10px] ${priorityColors[ticket.priority] || ''} font-arabic`}>
                        {getPriorityLabel(ticket.priority)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-arabic">
                        {getStatusLabel(ticket.status)}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
