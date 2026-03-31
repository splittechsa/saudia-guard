import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ConnectionPulse() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const channel = supabase.channel("heartbeat").subscribe((status) => {
      setConnected(status === "SUBSCRIBED");
    });
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald animate-pulse" : "bg-destructive"}`} />
          <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
            {connected ? "متصل" : "غير متصل"}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs font-arabic">{connected ? "النظام متصل بالسيرفر" : "فقد الاتصال بالسيرفر"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
