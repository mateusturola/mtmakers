import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "accent";
}

const ACCENTS: Record<string, string> = {
  primary: "bg-[#eef1ff] text-[#3d5afe]",
  success: "bg-[#e7f6ec] text-[#1b7a3d]",
  warning: "bg-[#fff4e5] text-[#b26a00]",
  accent: "bg-[#eef1ff] text-[#1f2a63]",
};

export function KPICard({ title, value, icon: Icon, hint, accent = "primary" }: KPICardProps) {
  return (
    <Card className="p-5 flex items-start justify-between gap-3 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-1 truncate tracking-tight">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
      <span className={cn("grid place-items-center h-11 w-11 rounded-xl shrink-0", ACCENTS[accent])}>
        <Icon className="h-5 w-5" />
      </span>
    </Card>
  );
}
