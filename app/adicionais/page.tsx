"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { EmptyState } from "@/components/shared/States";
import { useAdicionais, custoPorPeca, type AdicionalInput } from "@/hooks/use-adicionais";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, Package2 } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";
import type { Adicional } from "@/types";

export default function AdicionaisPage() {
  const { data, loaded, add, update, remove } = useAdicionais();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Adicional | null>(null);

  return (
    <>
      <Header
        title="Adicionais"
        subtitle="Materiais extras (fita, argola, LED…) com custo por peça"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo Adicional
          </Button>
        }
      />
      <PageContainer>
        <Card className="p-4 shadow-sm">
          {loaded && data.length === 0 ? (
            <EmptyState message="Nenhum adicional cadastrado. Cadastre fita, argola, LED, etc. e o custo por peça é calculado automaticamente." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Custo embalagem</TableHead>
                    <TableHead className="text-right">Rendimento</TableHead>
                    <TableHead className="text-right">Custo / peça</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.nome}
                        {a.observacao && (
                          <span className="block text-xs text-muted-foreground">
                            {a.observacao}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatBRL(a.custoEmbalagem)}</TableCell>
                      <TableCell className="text-right">
                        {a.rendimento} {a.unidade}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatBRL(a.custoPorPeca)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(a);
                                setOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={async () => {
                                if (confirm(`Excluir "${a.nome}"?`)) {
                                  try {
                                    await remove(a.rowNumber);
                                    toast.success("Adicional excluído");
                                  } catch (e) {
                                    toast.error((e as Error).message);
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <Package2 className="h-3.5 w-3.5" /> Salvos na planilha (aba Adicionais). Na calculadora
          e no cadastro de produtos você seleciona os adicionais e o custo/peça entra no preço.
        </p>
      </PageContainer>

      <AdicionalForm
        key={editing?.id ?? "novo"}
        open={open}
        onOpenChange={setOpen}
        adicional={editing}
        onSave={async (input) => {
          if (editing) await update(editing.rowNumber, input);
          else await add(input);
        }}
      />
    </>
  );
}

function AdicionalForm({
  open,
  onOpenChange,
  adicional,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  adicional?: Adicional | null;
  onSave: (input: AdicionalInput) => Promise<void>;
}) {
  const [nome, setNome] = useState(adicional?.nome ?? "");
  const [custo, setCusto] = useState(adicional ? String(adicional.custoEmbalagem) : "");
  const [rend, setRend] = useState(adicional ? String(adicional.rendimento) : "");
  const [unidade, setUnidade] = useState(adicional?.unidade ?? "un");
  const [obs, setObs] = useState(adicional?.observacao ?? "");
  const [saving, setSaving] = useState(false);

  const preview = custoPorPeca(Number(custo) || 0, Number(rend) || 0);

  async function salvar() {
    if (!nome || !custo || !rend) {
      toast.error("Nome, custo e rendimento são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        nome,
        custoEmbalagem: Number(custo),
        rendimento: Number(rend),
        unidade: unidade || "un",
        observacao: obs || undefined,
      });
      toast.success(adicional ? "Adicional atualizado" : "Adicional cadastrado");
      onOpenChange(false);
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
          <DialogTitle>{adicional ? "Editar adicional" : "Novo adicional"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Fita gorgurão, Argola, LED"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Custo da embalagem (R$) *</Label>
              <Input
                type="number"
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                placeholder="Ex: 38"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Rendimento *</Label>
              <Input
                type="number"
                value={rend}
                onChange={(e) => setRend(e.target.value)}
                placeholder="Ex: 60"
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Unidade do rendimento</Label>
            <Input
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              placeholder="peças, un, cm, m..."
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Observação</Label>
            <Input value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
          <div className="rounded-lg bg-accent px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Custo por peça</span>
            <span className="text-lg font-bold text-primary">{formatBRL(preview)}</span>
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
