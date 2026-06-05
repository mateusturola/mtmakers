"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { ProdutoForm } from "@/components/produtos/ProdutoForm";
import { ProdutoDetalhe } from "@/components/produtos/ProdutoDetalhe";
import { useCollection } from "@/hooks/use-collection";
import { useConfig } from "@/hooks/use-config";
import { TableSkeleton, ErrorState } from "@/components/shared/States";
import { DataTable, SortHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRODUTO_CATEGORIAS } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import type { Produto } from "@/types";
import { Plus, Search, Pencil } from "lucide-react";

const roundUp050 = (x: number) => Math.ceil(x * 2) / 2;
const precoPadrao = (custoPc: number, markup: number) =>
  roundUp050(custoPc * (1 + markup / 100));

function makeColumns(onEdit: (p: Produto) => void, markup: number): ColumnDef<Produto>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <SortHeader column={column}>ID</SortHeader>,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
    },
    {
      accessorKey: "peca",
      header: ({ column }) => <SortHeader column={column}>Peça</SortHeader>,
      cell: ({ row }) => <span className="font-medium">{row.original.peca}</span>,
    },
    {
      accessorKey: "categoria",
      header: "Categoria",
      cell: ({ row }) =>
        row.original.categoria ? (
          <Badge variant="secondary">{row.original.categoria}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "pesoG",
      header: ({ column }) => (
        <div className="text-right">
          <SortHeader column={column}>Peso (g)</SortHeader>
        </div>
      ),
      cell: ({ row }) => <div className="text-right">{row.original.pesoG}</div>,
    },
    {
      accessorKey: "tempoMin",
      header: ({ column }) => (
        <div className="text-right">
          <SortHeader column={column}>Tempo (min)</SortHeader>
        </div>
      ),
      cell: ({ row }) => <div className="text-right">{row.original.tempoMin}</div>,
    },
    {
      accessorKey: "custoPc",
      header: () => <div className="text-right">Custo/pç</div>,
      cell: ({ row }) => (
        <div className="text-right">{formatBRL(row.original.custoPc)}</div>
      ),
    },
    {
      id: "precoPadrao",
      accessorFn: (p) => precoPadrao(p.custoPc, markup),
      header: ({ column }) => (
        <div className="text-right">
          <SortHeader column={column}>{markup}% (padrão)</SortHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-bold text-primary">
          {formatBRL(precoPadrao(row.original.custoPc, markup))}
        </div>
      ),
    },
    {
      id: "acoes",
      header: "",
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.original);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}

export default function ProdutosPage() {
  const { data, loading, error, refetch } = useCollection<Produto>("/api/produtos");
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState<string>("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [detalhe, setDetalhe] = useState<Produto | null>(null);
  const { config } = useConfig();
  const markup = config.margemPadrao;

  const openEdit = useCallback((p: Produto) => {
    setEditing(p);
    setFormOpen(true);
  }, []);

  const columns = useMemo(() => makeColumns(openEdit, markup), [openEdit, markup]);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return data.filter((p) => {
      const okCat = cat === "todas" || p.categoria === cat;
      const okBusca =
        !q || p.peca.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      return okCat && okBusca;
    });
  }, [data, busca, cat]);

  const categorias = useMemo(() => {
    const usadas = data.map((p) => p.categoria).filter(Boolean);
    return Array.from(new Set([...PRODUTO_CATEGORIAS, ...usadas])) as string[];
  }, [data]);
  const categoriasUsadas = useMemo(
    () => Array.from(new Set(data.map((p) => p.categoria).filter(Boolean))) as string[],
    [data]
  );

  return (
    <>
      <Header
        title="Produtos"
        subtitle={`${data.length} no catálogo`}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        }
      />
      <PageContainer>
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou ID (MTK-XXX)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Chips de categoria */}
        <div className="flex flex-wrap gap-2 mb-5">
          <CatChip label="Todas" active={cat === "todas"} onClick={() => setCat("todas")} />
          {categorias.map((c) => (
            <CatChip key={c} label={c} active={cat === c} onClick={() => setCat(c)} />
          ))}
        </div>

        {loading ? (
          <TableSkeleton cols={7} />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <DataTable
            columns={columns}
            data={filtrados}
            onRowClick={setDetalhe}
            emptyMessage="Nenhum produto encontrado."
          />
        )}
      </PageContainer>

      <ProdutoForm
        key={editing?.rowNumber ?? "novo"}
        open={formOpen}
        onOpenChange={setFormOpen}
        produto={editing}
        onSaved={refetch}
        extraCategorias={categoriasUsadas}
      />

      <ProdutoDetalhe
        produto={detalhe}
        onClose={() => setDetalhe(null)}
        onEdit={openEdit}
      />
    </>
  );
}

function CatChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors border",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:border-primary/40"
      )}
    >
      {label}
    </button>
  );
}
