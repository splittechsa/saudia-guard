import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  numericValue?: number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  glowColor?: "blue" | "gold" | "emerald";
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 80, damping: 25 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = display.on("change", (v) => setShown(v));
    return unsub;
  }, [display]);

  return <>{shown}{suffix}</>;
}

export function StatCard({ label, value, numericValue, change, changeType = "neutral", icon: Icon, glowColor = "blue" }: StatCardProps) {
  const glowClass = glowColor === "gold" ? "glow-gold" : glowColor === "emerald" ? "glow-emerald" : "glow-blue";
  const iconBg = glowColor === "gold" ? "bg-accent/10 text-accent" : glowColor === "emerald" ? "bg-emerald/10 text-emerald" : "bg-primary/10 text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`rounded-xl bg-card border border-border p-5 ${glowClass} transition-all`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">
            {numericValue !== undefined ? <AnimatedNumber value={numericValue} suffix={value.replace(/[\d,٬٫.]+/, "").trim() ? ` ${value.replace(/[\d,٬٫.]+/, "").trim()}` : ""} /> : value}
          </p>
          {change && (
            <p className={`text-xs mt-1 font-mono ${
              changeType === "positive" ? "text-emerald" : changeType === "negative" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
