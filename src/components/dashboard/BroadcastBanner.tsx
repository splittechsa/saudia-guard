import { useEffect, useState } from "react";
import { Megaphone, X, Zap, BellRing, Sparkles, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

// ... (نفس الـ Interface السابقة)

export function BroadcastBanner() {
  const { roles } = useAuth();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchBroadcasts = async () => {
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      const { data } = await supabase
        .from("broadcasts")
        .select("*")
        .gte("created_at", oneDayAgo)
        .order("created_at", { ascending: false })
        .limit(3); // نكتفي بآخر 3 إعلانات لمنع ازدحام الواجهة
      if (data) setBroadcasts(data as Broadcast[]);
    };
    fetchBroadcasts();

    const channel = supabase
      .channel("broadcasts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "broadcasts" }, (payload) => {
        setBroadcasts((prev) => [payload.new as Broadcast, ...prev].slice(0, 3));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const visibleBroadcasts = broadcasts.filter((b) => {
    if (dismissed.has(b.id)) return false;
    if (b.target_role === "all") return true;
    return roles.includes(b.target_role as any);
  });

  if (visibleBroadcasts.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4 flex flex-col gap-3 pointer-events-none" dir="rtl">
      <AnimatePresence>
        {visibleBroadcasts.map((b) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto glass-strong rounded-2xl border border-accent/30 p-4 shadow-2xl shadow-accent/10 relative overflow-hidden group"
          >
            {/* Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-transparent opacity-50" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent animate-pulse shadow-[0_0_15px_rgba(163,230,53,0.1)]">
                <BellRing className="w-5 h-5" />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                   <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Split-Tech Broadcast</h4>
                   <span className="w-1 h-1 rounded-full bg-accent/40" />
                   <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date(b.created_at).toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' })}
                   </div>
                </div>
                
                <p className="text-sm font-bold text-foreground font-arabic leading-relaxed">
                  {b.message}
                </p>
              </div>

              <button 
                onClick={() => setDismissed((prev) => new Set(prev).add(b.id))} 
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Decorative Edge */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_10px_rgba(163,230,53,0.5)]" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}