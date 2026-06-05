"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { FaturamentoChart } from "@/components/dashboard/FaturamentoChart";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/States";
import { formatBRL, formatDateBR, formatPercent } from "@/lib/format";
import { useConfig } from "@/hooks/use-config";
import type { DashboardData } from "@/types";
import { ShoppingCart, DollarSign, Target, Handshake } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { config } = useConfig();

  const metaMensal = config.metaMensal;
  const faturamentoMes = data?.faturamentoMes ?? 0;
  const metaPercentual = metaMensal > 0 ? (faturamentoMes / metaMensal) * 100 : 0;

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro");
        setData(json.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header title="Dashboard" subtitle="Visão geral do negócio" />
      <PageContainer>
        {error ? (
          <ErrorState message={error} />
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {loading || !data ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))
              ) : (
                <>
                  <KPICard
                    title="Total de pedidos"
                    value={String(data.totalPedidos)}
                    icon={ShoppingCart}
                    accent="primary"
                  />
                  <KPICard
                    title="Faturamento do mês"
                    value={formatBRL(data.faturamentoMes)}
                    icon={DollarSign}
                    accent="success"
                  />
                  <KPICard
                    title="Meta mensal"
                    value={formatPercent(metaPercentual)}
                    hint={formatBRL(metaMensal)}
                    icon={Target}
                    accent="warning"
                  />
                  <KPICard
                    title="Saldo consignado"
                    value={formatBRL(data.saldoConsignado)}
                    icon={Handshake}
                    accent="accent"
                  />
                </>
              )}
            </div>

            {/* Progresso da meta */}
            {data && !loading && (
              <Card className="p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-primary">Meta mensal</h2>
                  <span className="text-sm text-muted-foreground">
                    {formatBRL(data.faturamentoMes)} / {formatBRL(metaMensal)}
                  </span>
                </div>
                <Progress value={Math.min(100, metaPercentual)} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {formatPercent(metaPercentual)} da meta atingida
                </p>
              </Card>
            )}

            {/* Gráfico de faturamento */}
            {data && !loading ? (
              <FaturamentoChart data={data.faturamentoPorMes} meta={metaMensal} />
            ) : (
              <Skeleton className="h-72 rounded-xl" />
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Status chart */}
              {data && !loading ? (
                <StatusChart data={data.statusResumo} />
              ) : (
                <Skeleton className="h-64 rounded-xl" />
              )}

              {/* Últimos pedidos */}
              {data && !loading ? (
                <Card className="p-5 shadow-sm">
                  <h2 className="font-semibold text-primary mb-4">Últimos pedidos</h2>
                  {data.ultimosPedidos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {data.ultimosPedidos.map((p) => (
                        <li key={p.id} className="flex items-center justify-between py-2.5 gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-primary truncate">{p.cliente || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.produto} · {formatDateBR(p.data)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold">{formatBRL(p.total)}</p>
                            <StatusBadge status={p.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              ) : (
                <Skeleton className="h-64 rounded-xl" />
              )}
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
