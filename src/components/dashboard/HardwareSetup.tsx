import { useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Cpu, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface HardwareSetupProps {
  storeId: string;
  onComplete: () => void;
}

export default function HardwareSetup({ storeId, onComplete }: HardwareSetupProps) {
  const [step, setStep] = useState<"choice" | "credentials">("choice");
  const [hardwareChoice, setHardwareChoice] = useState<"software" | "hardware">("software");
  const [rtspUrl, setRtspUrl] = useState("");
  const [cameraUser, setCameraUser] = useState("");
  const [cameraPass, setCameraPass] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        hardware_choice: hardwareChoice,
        rtsp_url: rtspUrl || null,
        camera_username: cameraUser || null,
        camera_password: cameraPass || null,
      })
      .eq("id", storeId);

    if (error) {
      toast.error("Failed to save hardware config");
    } else {
      toast.success("Hardware configured successfully!");
      onComplete();
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card border border-border p-6">
      <h3 className="text-sm font-semibold text-foreground mb-1">Hardware Setup</h3>
      <p className="text-xs text-muted-foreground mb-5">Choose how you want to run the AI auditor at your store.</p>

      {step === "choice" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "software" as const, icon: Monitor, title: "Software Only", desc: "Install on your existing PC", price: "Included" },
              { key: "hardware" as const, icon: Cpu, title: "Split-Pi Hardware", desc: "Dedicated Raspberry Pi device", price: "+600 SAR" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setHardwareChoice(opt.key)}
                className={`rounded-xl p-5 text-left border transition-all ${
                  hardwareChoice === opt.key ? "bg-card border-primary glow-blue" : "bg-secondary border-border hover:border-muted-foreground"
                }`}
              >
                <opt.icon className={`w-7 h-7 mb-3 ${hardwareChoice === opt.key ? "text-primary" : "text-muted-foreground"}`} />
                <h4 className="text-sm font-bold text-foreground">{opt.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                <p className="text-sm font-bold text-accent mt-3">{opt.price}</p>
              </button>
            ))}
          </div>
          <Button onClick={() => setStep("credentials")} className="bg-primary text-primary-foreground w-full">
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {step === "credentials" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-emerald" />
            <span className="text-xs text-muted-foreground">
              {hardwareChoice === "hardware" ? "Split-Pi Hardware" : "Software Only"} selected
            </span>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">RTSP URL</label>
            <Input
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              placeholder="rtsp://192.168.1.100:554/stream1"
              className="bg-secondary border-border text-foreground font-mono text-sm placeholder:text-muted-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Username</label>
              <Input value={cameraUser} onChange={(e) => setCameraUser(e.target.value)} placeholder="admin" className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Password</label>
              <Input type="password" value={cameraPass} onChange={(e) => setCameraPass(e.target.value)} placeholder="••••••••" className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("choice")} className="border-border text-foreground">Back</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground flex-1">
              {saving ? "Saving..." : "Activate"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
