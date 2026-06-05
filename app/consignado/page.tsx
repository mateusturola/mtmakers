"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import type { ColumnDef } from "@tanstack/react-table";
import { useCollection } from "@/hooks/use-collection";
import { TableSkeleton, ErrorState } from "@/components/shared/States";
import { DataTable, SortHeader } from "@/components/ui/data-table";
import { Combobox, type ComboItem } from "@/components/shared/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Trash2, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import { CONSIGNADO_STATUS } from "@/lib/constants";
import { formatBRL, formatDateBR } from "@/lib/format";
import { parseItens } from "@/lib/itens";
import type { Consignado, Cliente, Produto } from "@/types";

async function baixarPDF(c: Consignado) {
  try {
    const { gerarConsignadoPDF } = await import("@/lib/consignado-pdf");
    await gerarConsignadoPDF(c);
  } catch (e) {
    toast.error("Erro ao gerar PDF: " + (e as Error).message);
  }
}

const colunas: ColumnDef<Consignado>[] = [
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
    accessorKey: "data",
    header: ({ column }) => <SortHeader column={column}>Data</SortHeader>,
    cell: ({ row }) => formatDateBR(row.original.data) || "—",
  },
  {
    accessorKey: "produtosQtd",
    header: "Produtos",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-2 max-w-[280px]">
        {row.original.produtosQtd || "—"}
      </span>
    ),
  },
  {
    accessorKey: "valorConsignado",
    header: () => <div className="text-right">Consignado</div>,
    cell: ({ row }) => (
      <div className="text-right">{formatBRL(row.original.valorConsignado)}</div>
    ),
  },
  {
    accessorKey: "saldo",
    header: () => <div className="text-right">Saldo</div>,
    cell: ({ row }) => (
      <div className="text-right font-semibold">{formatBRL(row.original.saldo)}</div>
    ),
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
      <div className="text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            baixarPDF(row.original);
          }}
        >
          <FileText className="h-3.5 w-3.5" /> PDF
        </Button>
      </div>
    ),
  },
];

export default function ConsignadoPage() {
  const { data, loading, error, refetch } = useCollection<Consignado>("/api/consignado");
  const [open, setOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<Consignado | null>(null);

  return (
    <>
      <Header
        title="Consignado"
        subtitle="Produtos com revendedores"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Consignado
          </Button>
        }
      />
      <PageContainer>
        {loading ? (
          <TableSkeleton cols={7} />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <DataTable
            columns={colunas}
            data={data}
            onRowClick={setDetalhe}
            emptyMessage="Nenhum consignado registrado."
          />
        )}
      </PageContainer>

      <ConsignadoForm open={open} onOpenChange={setOpen} onSaved={refetch} />
      <ConsignadoDetalhe
        consignado={detalhe}
        onClose={() => setDetalhe(null)}
        onUpdated={refetch}
      />
    </>
  );
}

function ConsignadoDetalhe({
  consignado,
  onClose,
  onUpdated,
}: {
  consignado: Consignado | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [devolvido, setDevolvido] = useState("0");
  const [statusV, setStatusV] = useState("Ativo");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (consignado) {
      setDevolvido(String(consignado.valorDevolvido));
      setStatusV(consignado.status || "Ativo");
      setObs(consignado.observacoes || "");
    }
  }, [consignado]);

  const itens = consignado ? parseItens(consignado.produtosQtd) : [];
  const saldo = consignado ? consignado.valorConsignado - (Number(devolvido) || 0) : 0;

  async function salvar() {
    if (!consignado) return;
    setSaving(true);
    try {
      const res = await fetch("/api/consignado", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...consignado,
          valorDevolvido: Number(devolvido) || 0,
          status: statusV,
          observacoes: obs,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Consignado atualizado");
      onUpdated();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={!!consignado} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{consignado?.id} · {consignado?.cliente}</SheetTitle>
        </SheetHeader>
        {consignado && (
          <div className="mt-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Data" value={formatDateBR(consignado.data) || "—"} />
              <Info label="Valor consignado" value={formatBRL(consignado.valorConsignado)} />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Produtos deixados</p>
              {itens.length > 0 ? (
                <ul className="rounded-lg border border-border divide-y divide-border">
                  {itens.map((i, idx) => (
                    <li key={idx} className="flex justify-between px-3 py-1.5">
                      <span>
                        {i.qtd}× {i.produto}
                      </span>
                      <span className="text-muted-foreground">
                        {formatBRL(i.qtd * i.valorUnit)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">{consignado.produtosQtd || "—"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Valor devolvido (R$)</Label>
                <Input
                  type="number"
                  value={devolvido}
                  onChange={(e) => setDevolvido(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Saldo</Label>
                <div className="h-9 flex items-center font-semibold text-primary">
                  {formatBRL(saldo)}
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Status</Label>
              <Select value={statusV} onValueChange={(v) => setStatusV(v ?? "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSIGNADO_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block">Observações</Label>
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => baixarPDF(consignado)}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
              <Button className="flex-1" onClick={salvar} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
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

interface ItemConsig {
  produto: string;
  qtd: string;
  valorUnit: string;
}

function ConsignadoForm({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { data: clientes } = useCollection<Cliente>("/api/clientes");
  const { data: produtos } = useCollection<Produto>("/api/produtos");
  const [idCliente, setIdCliente] = useState("");
  const [cliente, setCliente] = useState("");
  const [data, setData] = useState("");
  const [itens, setItens] = useState<ItemConsig[]>([
    { produto: "", qtd: "1", valorUnit: "" },
  ]);
  const [devolvido, setDevolvido] = useState("0");
  const [status, setStatus] = useState("Ativo");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  const clienteItems: ComboItem[] = clientes.map((c) => ({
    value: c.id,
    label: c.nome,
    sublabel: c.id,
  }));
  const produtoItems: ComboItem[] = produtos.map((p) => ({
    value: p.id,
    label: p.peca,
    sublabel: `${p.id} · ${formatBRL(p.preco50)}`,
  }));

  const total = itens.reduce(
    (acc, i) => acc + (Number(i.qtd) || 0) * (Number(i.valorUnit) || 0),
    0
  );

  function setItem(idx: number, patch: Partial<ItemConsig>) {
    setItens((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItens((arr) => [...arr, { produto: "", qtd: "1", valorUnit: "" }]);
  }
  function removeItem(idx: number) {
    setItens((arr) => (arr.length > 1 ? arr.filter((_, i) => i !== idx) : arr));
  }

  function reset() {
    setIdCliente("");
    setCliente("");
    setData("");
    setItens([{ produto: "", qtd: "1", valorUnit: "" }]);
    setDevolvido("0");
    setObs("");
  }

  async function salvar() {
    const validos = itens.filter((i) => i.produto && Number(i.qtd) > 0);
    if (!cliente) {
      toast.error("Selecione o cliente");
      return;
    }
    if (validos.length === 0) {
      toast.error("Adicione ao menos um produto");
      return;
    }
    const produtosQtd = validos
      .map((i) => `${i.qtd}× ${i.produto} @ ${formatBRL(Number(i.valorUnit) || 0)}`)
      .join("; ");

    setSaving(true);
    try {
      const res = await fetch("/api/consignado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCliente,
          cliente,
          data: data ? data.split("-").reverse().join("/") : undefined,
          produtosQtd,
          valorConsignado: total,
          valorDevolvido: Number(devolvido) || 0,
          status,
          observacoes: obs,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Consignado registrado");
      onOpenChange(false);
      reset();
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo consignado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Cliente *</Label>
              <Combobox
                items={clienteItems}
                value={idCliente}
                onSelect={(i) => {
                  setIdCliente(i.value);
                  setCliente(i.label);
                }}
                placeholder="Buscar cliente..."
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>

          {/* Lista de produtos deixados */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Produtos deixados</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {itens.map((it, idx) => {
                const lineTotal =
                  (Number(it.qtd) || 0) * (Number(it.valorUnit) || 0);
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_64px_96px_auto] gap-2 items-end rounded-lg border border-border p-2"
                  >
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Produto</Label>
                      <Combobox
                        items={produtoItems}
                        value={produtos.find((p) => p.peca === it.produto)?.id ?? ""}
                        onSelect={(i) => {
                          const p = produtos.find((x) => x.id === i.value);
                          setItem(idx, {
                            produto: i.label,
                            valorUnit: p?.preco50 ? String(p.preco50) : it.valorUnit,
                          });
                        }}
                        placeholder="Produto..."
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Qtd</Label>
                      <Input
                        type="number"
                        value={it.qtd}
                        onChange={(e) => setItem(idx, { qtd: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Valor un.</Label>
                      <Input
                        type="number"
                        value={it.valorUnit}
                        onChange={(e) => setItem(idx, { valorUnit: e.target.value })}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      onClick={() => removeItem(idx)}
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <p className="col-span-4 text-right text-xs text-muted-foreground -mt-1">
                      Subtotal: {formatBRL(lineTotal)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end rounded-lg bg-muted px-4 py-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Valor consignado (total)</p>
              <p className="text-xl font-bold text-primary">{formatBRL(total)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Valor devolvido (R$)</Label>
              <Input
                type="number"
                value={devolvido}
                onChange={(e) => setDevolvido(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSIGNADO_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Observações</Label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
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
