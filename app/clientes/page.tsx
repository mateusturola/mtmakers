"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { useCollection } from "@/hooks/use-collection";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/shared/States";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreVertical, Pencil, Trash2, Phone } from "lucide-react";
import { toast } from "sonner";
import { CLIENTE_TIPOS } from "@/lib/constants";
import { formatDateBR } from "@/lib/format";
import type { Cliente, Pedido } from "@/types";

export default function ClientesPage() {
  const { data, loading, error, refetch } = useCollection<Cliente>("/api/clientes");
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<string>("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [detalhe, setDetalhe] = useState<Cliente | null>(null);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return data.filter((c) => {
      const okTipo = tipo === "todos" || c.tipo === tipo;
      const okBusca =
        !q ||
        c.nome.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.cidade.toLowerCase().includes(q);
      return okTipo && okBusca;
    });
  }, [data, busca, tipo]);

  async function handleDelete(c: Cliente) {
    if (!confirm(`Excluir o cliente "${c.nome}"?`)) return;
    try {
      const res = await fetch(`/api/clientes?rowNumber=${c.rowNumber}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Cliente excluído");
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <Header
        title="Clientes"
        subtitle={`${data.length} cadastrados`}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo Cliente
          </Button>
        }
      />
      <PageContainer>
        <Card className="p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, ID ou cidade..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tipo} onValueChange={(v) => setTipo(v ?? "todos")}>
              <SelectTrigger className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {CLIENTE_TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <TableSkeleton cols={6} />
          ) : error ? (
            <ErrorState message={error} />
          ) : filtrados.length === 0 ? (
            <EmptyState message="Nenhum cliente encontrado." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((c) => (
                    <TableRow
                      key={c.rowNumber}
                      className="cursor-pointer"
                      onClick={() => setDetalhe(c)}
                    >
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>{c.whatsapp}</TableCell>
                      <TableCell>{c.tipo}</TableCell>
                      <TableCell>{c.cidade || "—"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(c);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(c)}
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
      </PageContainer>

      <ClienteForm
        key={editing?.rowNumber ?? "novo"}
        open={formOpen}
        onOpenChange={setFormOpen}
        cliente={editing}
        onSaved={refetch}
      />

      <ClienteDetalhe cliente={detalhe} onClose={() => setDetalhe(null)} />
    </>
  );
}

function ClienteDetalhe({ cliente, onClose }: { cliente: Cliente | null; onClose: () => void }) {
  const { data: pedidos, loading } = useCollection<Pedido>("/api/pedidos");
  const doCliente = pedidos.filter(
    (p) => p.idCliente === cliente?.id || p.cliente === cliente?.nome
  );

  return (
    <Sheet open={!!cliente} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{cliente?.nome}</SheetTitle>
        </SheetHeader>
        {cliente && (
          <div className="mt-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="ID" value={cliente.id} />
              <Info label="Tipo" value={cliente.tipo} />
              <Info label="Cidade" value={cliente.cidade || "—"} />
              <Info label="Cadastrado" value={formatDateBR(cliente.cadastradoEm)} />
            </div>
            <a
              href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-secondary font-medium"
            >
              <Phone className="h-4 w-4" /> {cliente.whatsapp}
            </a>
            {cliente.observacoes && (
              <p className="text-muted-foreground">{cliente.observacoes}</p>
            )}
            <div>
              <h3 className="font-semibold text-primary mb-2">Histórico de pedidos</h3>
              {loading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : doCliente.length === 0 ? (
                <p className="text-muted-foreground">Nenhum pedido para este cliente.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {doCliente.map((p) => (
                    <li key={p.id} className="py-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{p.produto}</span>
                        <span className="font-mono text-xs">{p.id}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateBR(p.data)} · {p.status}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
