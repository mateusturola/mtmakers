"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { useCollection } from "@/hooks/use-collection";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/shared/States";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Combobox, type ComboItem } from "@/components/shared/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PEDIDO_STATUS } from "@/lib/constants";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { Entrada, Produto } from "@/types";

export default function EntradasPage() {
  const { data, loading, error, refetch } = useCollection<Entrada>("/api/entradas");
  const [open, setOpen] = useState(false);

  const totalGeral = useMemo(() => data.reduce((a, e) => a + e.total, 0), [data]);

  return (
    <>
      <Header
        title="Entradas"
        subtitle="Vendas rápidas"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nova Entrada
          </Button>
        }
      />
      <PageContainer>
        <Card className="p-4 shadow-sm">
          {loading ? (
            <TableSkeleton cols={6} />
          ) : error ? (
            <ErrorState message={error} />
          ) : data.length === 0 ? (
            <EmptyState message="Nenhuma entrada registrada." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Preço un.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((e) => (
                    <TableRow key={e.rowNumber}>
                      <TableCell>{formatDateBR(e.data)}</TableCell>
                      <TableCell className="font-medium">{e.produto}</TableCell>
                      <TableCell className="text-right">{e.qtd}</TableCell>
                      <TableCell className="text-right">{formatBRL(e.precoUnit)}</TableCell>
                      <TableCell className="text-right">{formatBRL(e.total)}</TableCell>
                      <TableCell>
                        <StatusBadge status={e.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-3 text-sm">
                <span className="text-muted-foreground mr-2">Total geral:</span>
                <span className="font-bold text-primary">{formatBRL(totalGeral)}</span>
              </div>
            </div>
          )}
        </Card>
      </PageContainer>

      <EntradaForm open={open} onOpenChange={setOpen} onSaved={refetch} />
    </>
  );
}

function EntradaForm({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { data: produtos } = useCollection<Produto>("/api/produtos");
  const [idProduto, setIdProduto] = useState("");
  const [produto, setProduto] = useState("");
  const [qtd, setQtd] = useState("1");
  const [preco, setPreco] = useState("");
  const [status, setStatus] = useState("Entregue");
  const [saving, setSaving] = useState(false);

  const items: ComboItem[] = produtos.map((p) => ({
    value: p.id,
    label: p.peca,
    sublabel: `${p.id} · ${formatBRL(p.preco50)}`,
  }));

  async function salvar() {
    if (!produto || !qtd) {
      toast.error("Produto e quantidade são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/entradas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idProduto,
          produto,
          qtd: Number(qtd),
          precoUnit: Number(preco) || 0,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Entrada registrada");
      onOpenChange(false);
      setIdProduto("");
      setProduto("");
      setQtd("1");
      setPreco("");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova entrada</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Produto *</Label>
            <Combobox
              items={items}
              value={idProduto}
              onSelect={(i) => {
                setIdProduto(i.value);
                setProduto(i.label);
                const p = produtos.find((x) => x.id === i.value);
                if (p?.preco50) setPreco(String(p.preco50));
              }}
              placeholder="Buscar produto..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Quantidade *</Label>
              <Input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Preço un. (R$)</Label>
              <Input type="number" value={preco} onChange={(e) => setPreco(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
