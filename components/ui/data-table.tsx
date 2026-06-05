"use client";

import { useState } from "react";
import {
  type Column,
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  pageSize = 10,
  emptyMessage = "Nenhum registro.",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: { pagination: { pageSize } },
  });

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} ·{" "}
            {table.getRowCount()} itens
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Cabeçalho clicável para ordenar uma coluna.
export function SortHeader<TData>({
  column,
  children,
  className = "",
}: {
  column: Column<TData, unknown>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`-ml-2 h-8 ${className}`}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
    </Button>
  );
}
