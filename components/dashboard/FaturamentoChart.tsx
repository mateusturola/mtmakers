"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatBRL } from "@/lib/format";

const chartConfig = {
  faturado: { label: "Faturado", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

interface Props {
  data: { mes: string; faturado: number }[];
  meta: number;
}

export function FaturamentoChart({ data, meta }: Props) {
  return (
    <Card className="p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-foreground">Faturamento por mês</h2>
          <p className="text-sm text-muted-foreground">
            Últimos 6 meses · meta {formatBRL(meta)}
          </p>
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <AreaChart data={data} margin={{ left: 12, right: 12, top: 12 }}>
          <defs>
            <linearGradient id="fillFaturado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value) => formatBRL(Number(value))}
                labelFormatter={(label) => `Mês: ${label}`}
              />
            }
          />
          {meta > 0 && (
            <ReferenceLine
              y={meta}
              stroke="hsl(var(--secondary))"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: "Meta",
                position: "insideTopRight",
                fill: "hsl(var(--secondary))",
                fontSize: 11,
              }}
            />
          )}
          <Area
            dataKey="faturado"
            type="natural"
            fill="url(#fillFaturado)"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
}
