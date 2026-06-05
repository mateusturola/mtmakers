import { statusStyle } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const { bg, text } = statusStyle(status);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: bg, color: text }}
    >
      {status}
    </span>
  );
}
