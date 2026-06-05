"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { useCollection } from "@/hooks/use-collection";
import { useConfig } from "@/hooks/use-config";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/shared/States";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { PEDIDO_STATUS } from "@/lib/constants";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { Pedido } from "@/types";

export default function PedidosPage() {
  const { data, loading, error, refetch } = useCollection<Pedido>("/api/pedidos");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [sel, setSel] = useState<Pedido | null>(null);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return data.filter((p) => {
      const okStatus = status === "todos" || p.status === status;
      const okBusca =
        !q ||
        p.cliente.toLowerCase().includes(q) ||
        p.produto.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return okStatus && okBusca;
    });
  }, [data, busca, status]);

  return (
    <>
      <Header
        title="Pedidos"
        subtitle={`${data.length} registrados`}
        action={
          <Button asChild>
            <Link href="/pedidos/novo">
              <Plus className="h-4 w-4" /> Novo Pedido
            </Link>
          </Button>
        }
      />
      <PageContainer>
        <Card className="p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
              <SelectTrigger className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {PEDIDO_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <TableSkeleton cols={7} />
          ) : error ? (
            <ErrorState message={error} />
          ) : filtrados.length === 0 ? (
            <EmptyState message="Nenhum pedido encontrado." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Restante</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((p) => (
                    <TableRow key={p.rowNumber} className="cursor-pointer" onClick={() => setSel(p)}>
                      <TableCell className="font-mono text-xs">{p.id}</TableCell>
                      <TableCell className="font-medium">{p.cliente}</TableCell>
                      <TableCell>{p.produto}</TableCell>
                      <TableCell>{formatDateBR(p.data)}</TableCell>
                      <TableCell className="text-right">{formatBRL(p.total)}</TableCell>
                      <TableCell className="text-right">{formatBRL(p.restante)}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </PageContainer>

      <PedidoDrawer pedido={sel} onClose={() => setSel(null)} onUpdated={refetch} />
    </>
  );
}

function PedidoDrawer({
  pedido,
  onClose,
  onUpdated,
}: {
  pedido: Pedido | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const { config } = useConfig();

  async function baixarPDF() {
    if (!pedido) return;
    try {
      const { gerarPedidoPDF } = await import("@/lib/pedido-pdf");
      await gerarPedidoPDF(
        {
          id: pedido.id,
          cliente: pedido.cliente,
          produto: pedido.produto,
          data: pedido.data,
          dataEntrega: pedido.dataEntrega,
          qtd: pedido.qtd,
          precoUnit: pedido.precoUnit,
          total: pedido.total,
          entradaPaga: pedido.entradaPaga,
          restante: pedido.restante,
          formaPgto: pedido.formaPgto,
          status: pedido.status,
          enderecoEntrega: pedido.enderecoEntrega,
          observacoes: pedido.observacoes,
        },
        config
      );
    } catch (e) {
      toast.error("Erro ao gerar PDF: " + (e as Error).message);
    }
  }

  async function alterarStatus(novo: string) {
    if (!pedido) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pedido, status: novo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Status atualizado");
      onUpdated();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={!!pedido} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{pedido?.id}</SheetTitle>
        </SheetHeader>
        {pedido && (
          <div className="mt-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Cliente" value={pedido.cliente} />
              <Info label="Produto" value={pedido.produto} />
              <Info label="Quantidade" value={String(pedido.qtd)} />
              <Info label="Preço unit." value={formatBRL(pedido.precoUnit)} />
              <Info label="Total" value={formatBRL(pedido.total)} />
              <Info label="Entrada" value={formatBRL(pedido.entradaPaga)} />
              <Info label="Restante" value={formatBRL(pedido.restante)} />
              <Info label="Forma pgto" value={pedido.formaPgto || "—"} />
              <Info label="Data" value={formatDateBR(pedido.data)} />
              <Info label="Entrega" value={formatDateBR(pedido.dataEntrega) || "—"} />
            </div>
            {pedido.enderecoEntrega && (
              <Info label="Endereço" value={pedido.enderecoEntrega} />
            )}
            {pedido.observacoes && <Info label="Observações" value={pedido.observacoes} />}

            <Button variant="outline" className="w-full" onClick={baixarPDF}>
              <FileText className="h-4 w-4" /> Gerar PDF do pedido
            </Button>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Atualizar status</p>
              <Select
                defaultValue={pedido.status}
                onValueChange={(v) => v && alterarStatus(v)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PEDIDO_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
