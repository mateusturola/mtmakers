import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatBRL } from "@/lib/format";
import { statusStyle } from "@/lib/constants";

interface Item {
  status: string;
  quantidade: number;
  valor: number;
}

export function StatusChart({ data }: { data: Item[] }) {
  const max = Math.max(1, ...data.map((d) => d.quantidade));
  return (
    <Card className="p-5 shadow-sm">
      <h2 className="font-semibold text-primary mb-4">Pedidos por status</h2>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum pedido registrado.</p>
      ) : (
        <div className="space-y-3">
          {data.map((d) => {
            const { text } = statusStyle(d.status);
            return (
              <div key={d.status}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <StatusBadge status={d.status} />
                  <span className="text-muted-foreground">
                    {d.quantidade} · {formatBRL(d.valor)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(d.quantidade / max) * 100}%`,
                      backgroundColor: text,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
