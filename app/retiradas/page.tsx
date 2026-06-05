"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { useCollection } from "@/hooks/use-collection";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { FORMAS_PGTO } from "@/lib/constants";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { Retirada } from "@/types";

export default function RetiradasPage() {
  const { data, loading, error, refetch } = useCollection<Retirada>("/api/retiradas");
  const [open, setOpen] = useState(false);

  const total = useMemo(() => data.reduce((a, r) => a + r.valor, 0), [data]);

  return (
    <>
      <Header
        title="Retiradas"
        subtitle="Saídas e pagamentos"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nova Retirada
          </Button>
        }
      />
      <PageContainer>
        <Card className="p-4 shadow-sm">
          {loading ? (
            <TableSkeleton cols={5} />
          ) : error ? (
            <ErrorState message={error} />
          ) : data.length === 0 ? (
            <EmptyState message="Nenhuma retirada registrada." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Forma pgto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((r) => (
                    <TableRow key={r.rowNumber}>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell>{formatDateBR(r.data)}</TableCell>
                      <TableCell className="font-medium">{r.descricao}</TableCell>
                      <TableCell className="text-right">{formatBRL(r.valor)}</TableCell>
                      <TableCell>{r.formaPgto}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-3 text-sm">
                <span className="text-muted-foreground mr-2">Total retirado:</span>
                <span className="font-bold text-destructive">{formatBRL(total)}</span>
              </div>
            </div>
          )}
        </Card>
      </PageContainer>

      <RetiradaForm open={open} onOpenChange={setOpen} onSaved={refetch} />
    </>
  );
}

function RetiradaForm({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [formaPgto, setFormaPgto] = useState("PIX");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  async function salvar() {
    if (!descricao || !valor) {
      toast.error("Descrição e valor são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/retiradas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao,
          valor: Number(valor),
          formaPgto,
          observacoes: obs,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Retirada registrada");
      onOpenChange(false);
      setDescricao("");
      setValor("");
      setObs("");
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
          <DialogTitle>Nova retirada</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Descrição *</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Valor (R$) *</Label>
            <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Forma de pagamento</Label>
            <Select value={formaPgto} onValueChange={(v) => setFormaPgto(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_PGTO.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
