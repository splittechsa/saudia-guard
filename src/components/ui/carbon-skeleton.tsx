import { cn } from "@/lib/utils";

export function CarbonSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl",
        className
      )}
      style={{
        background: "linear-gradient(90deg, #0A0A0A 25%, #1A1A1A 50%, #0A0A0A 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite ease-in-out",
      }}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      <CarbonSkeleton className="h-8 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <CarbonSkeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-5 space-y-3" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <CarbonSkeleton className="h-3 w-24" />
          <CarbonSkeleton className="h-7 w-16" />
          <CarbonSkeleton className="h-3 w-20" />
        </div>
        <CarbonSkeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}
