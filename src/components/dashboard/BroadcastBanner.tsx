import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Broadcast {
  id: string;
  message: string;
  target_role: string;
  created_at: string;
}

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
        .limit(5);
      if (data) setBroadcasts(data as Broadcast[]);
    };
    fetchBroadcasts();

    const channel = supabase
      .channel("broadcasts-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "broadcasts" }, (payload) => {
        setBroadcasts((prev) => [payload.new as Broadcast, ...prev].slice(0, 5));
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
    <AnimatePresence>
      {visibleBroadcasts.map((b) => (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-xl bg-accent/10 border border-accent/30 p-4 flex items-start gap-3"
        >
          <Megaphone className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground font-arabic">{b.message}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">
              {new Date(b.created_at).toLocaleString("ar-SA")}
            </p>
          </div>
          <button onClick={() => setDismissed((prev) => new Set(prev).add(b.id))} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
