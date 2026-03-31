import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, X, Download, Shield, Wrench, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  description: string;
  user_id: string;
  created_at: string;
}

interface TicketChatProps {
  ticket: Ticket;
  onClose: () => void;
  onStatusChange?: (ticketId: string, status: string) => void;
  senderRole?: string;
}

const ROLE_LABELS: Record<string, string> = {
  merchant: "التاجر",
  it_support: "الدعم التقني",
  customer_support: "دعم العملاء",
  super_owner: "المالك",
  ai_bot: "المساعد الذكي",
};

const ROLE_ICONS: Record<string, typeof User> = {
  merchant: User,
  it_support: Wrench,
  super_owner: Shield,
  customer_support: User,
  ai_bot: Bot,
};

export default function TicketChat({ ticket, onClose, onStatusChange, senderRole = "merchant" }: TicketChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isResolved = ticket.status === "resolved" || ticket.status === "closed";

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ticket_messages",
        filter: `ticket_id=eq.${ticket.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticket.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
  };

  const handleSend = async () => {
    if (!user || !newMsg.trim() || isResolved) return;
    const msgText = newMsg.trim();
    setSending(true);
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      sender_role: senderRole,
      message: msgText,
    });
    setSending(false);
    if (error) {
      toast.error("خطأ في إرسال الرسالة");
      return;
    }
    setNewMsg("");

    // Trigger AI bot response for merchant messages
    if (senderRole === "merchant") {
      setAiThinking(true);
      try {
        const history = messages.slice(-10).map(m => ({
          role: m.sender_role === "ai_bot" ? "assistant" as const : "user" as const,
          content: m.message,
        }));

        const { data, error: fnError } = await supabase.functions.invoke("ai-support-chat", {
          body: { ticket_id: ticket.id, message: msgText, conversation_history: history },
        });

        if (fnError) console.error("AI bot error:", fnError);
      } catch (e) {
        console.error("AI bot error:", e);
      } finally {
        setAiThinking(false);
      }
    }
  };

  const handleResolve = () => {
    onStatusChange?.(ticket.id, "resolved");
  };

  const handleDownloadLog = () => {
    const lines = [
      `تذكرة: ${ticket.subject}`,
      `الحالة: ${ticket.status}`,
      `الأولوية: ${ticket.priority}`,
      `الوصف: ${ticket.description}`,
      `تاريخ الإنشاء: ${new Date(ticket.created_at).toLocaleString("ar-SA")}`,
      "---",
      ...messages.map(
        (m) => `[${new Date(m.created_at).toLocaleString("ar-SA")}] (${ROLE_LABELS[m.sender_role] || m.sender_role}): ${m.message}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${ticket.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground font-arabic truncate">{ticket.subject}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-[10px] ${
                ticket.priority === "high" ? "text-destructive border-destructive/30" : ticket.priority === "medium" ? "text-accent border-accent/30" : "text-emerald border-emerald/30"
              }`}>
                {ticket.priority === "high" ? "عالية" : ticket.priority === "medium" ? "متوسطة" : "منخفضة"}
              </Badge>
              <Badge variant="outline" className={`text-[10px] ${
                isResolved ? "text-emerald border-emerald/30" : "text-primary border-primary/30"
              }`}>
                {isResolved ? "مغلقة" : ticket.status === "in_progress" ? "قيد المعالجة" : "مفتوحة"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleDownloadLog} className="h-8 w-8 p-0" title="تحميل السجل">
              <Download className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Initial description */}
        <div className="px-4 py-3 bg-secondary/20 border-b border-border">
          <p className="text-xs text-muted-foreground font-arabic">{ticket.description}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
            {new Date(ticket.created_at).toLocaleString("ar-SA")}
          </p>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            const RoleIcon = ROLE_ICONS[msg.sender_role] || User;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender_role === "super_owner" ? "bg-destructive/20" :
                  msg.sender_role === "it_support" ? "bg-accent/20" :
                  msg.sender_role === "ai_bot" ? "bg-emerald/20" :
                  "bg-primary/20"
                }`}>
                  <RoleIcon className="w-3.5 h-3.5 text-foreground" />
                </div>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 ${
                  isMe ? "bg-primary/20 border border-primary/30" : "bg-secondary/50 border border-border"
                }`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-muted-foreground font-arabic">
                      {ROLE_LABELS[msg.sender_role] || msg.sender_role}
                    </span>
                    <span className="text-[9px] text-muted-foreground/50 font-mono">
                      {new Date(msg.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-arabic leading-relaxed">{msg.message}</p>
                </div>
              </motion.div>
            );
          })}
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8 font-arabic">لا توجد رسائل بعد — ابدأ المحادثة</p>
          )}
        </div>

        {/* Input */}
        {isResolved ? (
          <div className="p-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground font-arabic">تم إغلاق هذه التذكرة</p>
            <Button size="sm" variant="ghost" onClick={handleDownloadLog} className="mt-2 text-xs font-arabic gap-1">
              <Download className="w-3 h-3" /> تحميل سجل المحادثة
            </Button>
          </div>
        ) : (
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="اكتب رسالتك..."
                className="flex-1 bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground font-arabic placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button onClick={handleSend} disabled={sending || !newMsg.trim()} className="bg-primary text-primary-foreground h-10 w-10 p-0 rounded-xl">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {(senderRole === "it_support" || senderRole === "super_owner") && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={handleResolve} className="text-xs font-arabic text-emerald border-emerald/30 hover:bg-emerald/10">
                  ✓ إغلاق التذكرة
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
