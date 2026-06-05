"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { useCollection } from "@/hooks/use-collection";
import { useConfig } from "@/hooks/use-config";
import { TableSkeleton, ErrorState } from "@/components/shared/States";
import { DataTable, SortHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ORCAMENTO_STATUS } from "@/lib/constants";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { Orcamento } from "@/types";
import type { Config } from "@/lib/config";
import { Plus, Search, FileText, ArrowRightLeft } from "lucide-react";

async function baixarPDF(o: Orcamento, config: Config) {
  try {
    const { gerarOrcamentoPDF } = await import("@/lib/orcamento-pdf");
    await gerarOrcamentoPDF(o, config);
  } catch (e) {
    toast.error("Erro ao gerar PDF: " + (e as Error).message);
  }
}

export default function OrcamentosPage() {
  const { data, loading, error, refetch } = useCollection<Orcamento>("/api/orcamentos");
  const { config } = useConfig();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [convertendo, setConvertendo] = useState<number | null>(null);

  async function converter(o: Orcamento) {
    if (o.status === "Convertido") return;
    if (!confirm(`Transformar o orçamento ${o.id} (${o.cliente}) em pedido?`)) return;
    setConvertendo(o.rowNumber);
    try {
      const res = await fetch("/api/orcamentos/converter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber: o.rowNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Pedido ${json.data.pedidoId} criado a partir do orçamento!`);
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setConvertendo(null);
    }
  }

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return data.filter((o) => {
      const okStatus = status === "todos" || o.status === status;
      const okBusca =
        !q ||
        o.cliente.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.produtos.toLowerCase().includes(q);
      return okStatus && okBusca;
    });
  }, [data, busca, status]);

  const colunas: ColumnDef<Orcamento>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => <SortHeader column={column}>ID</SortHeader>,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
      },
      {
        accessorKey: "cliente",
        header: ({ column }) => <SortHeader column={column}>Cliente</SortHeader>,
        cell: ({ row }) => <span className="font-medium">{row.original.cliente}</span>,
      },
      {
        accessorKey: "produtos",
        header: "Produtos",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[260px]">
            {row.original.produtos || "—"}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => (
          <div className="text-right font-semibold">{formatBRL(row.original.total)}</div>
        ),
      },
      {
        accessorKey: "validade",
        header: ({ column }) => <SortHeader column={column}>Validade</SortHeader>,
        cell: ({ row }) => formatDateBR(row.original.validade) || "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => row.original.status || "—",
      },
      {
        id: "acoes",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => baixarPDF(row.original, config)}
            >
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
            {row.original.status !== "Convertido" && (
              <Button
                size="sm"
                onClick={() => converter(row.original)}
                disabled={convertendo === row.original.rowNumber}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> Virar pedido
              </Button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, convertendo]
  );

  return (
    <>
      <Header
        title="Orçamentos"
        subtitle={`${data.length} registrados`}
        action={
          <Button asChild>
            <Link href="/orcamentos/novo">
              <Plus className="h-4 w-4" /> Novo Orçamento
            </Link>
          </Button>
        }
      />
      <PageContainer>
        <Card className="p-4 shadow-sm mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, produto ou ID..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "todos")}>
              <SelectTrigger className="sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {ORCAMENTO_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {loading ? (
          <TableSkeleton cols={7} />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <DataTable
            columns={colunas}
            data={filtrados}
            emptyMessage="Nenhum orçamento encontrado."
          />
        )}
      </PageContainer>
    </>
  );
}
