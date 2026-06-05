"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdicionais } from "@/hooks/use-adicionais";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Plus, Minus, X, ChevronsUpDown } from "lucide-react";

interface Props {
  onChange: (total: number, resumo: string) => void;
}

const round2 = (x: number) => Math.round(x * 100) / 100;

export function AdicionaisPicker({ onChange }: Props) {
  const { data, loaded } = useAdicionais();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});

  function emit(next: Record<string, number>) {
    const total = round2(
      data.reduce((acc, a) => acc + a.custoPorPeca * (next[a.id] || 0), 0)
    );
    const resumo = data
      .filter((a) => (next[a.id] || 0) > 0)
      .map((a) => `${next[a.id]}× ${a.nome}`)
      .join(", ");
    onChange(total, resumo);
  }

  function setQ(id: string, q: number) {
    q = Math.max(0, q);
    const next = { ...qty };
    if (q === 0) delete next[id];
    else next[id] = q;
    setQty(next);
    emit(next);
  }

  if (loaded && data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nenhum adicional cadastrado.{" "}
        <Link href="/adicionais" className="text-primary underline">
          Cadastrar adicionais
        </Link>
      </p>
    );
  }

  const selecionados = data.filter((a) => (qty[a.id] || 0) > 0);
  const total = round2(
    data.reduce((acc, a) => acc + a.custoPorPeca * (qty[a.id] || 0), 0)
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
          >
            <span className={selecionados.length ? "" : "text-muted-foreground"}>
              {selecionados.length
                ? `${selecionados.length} adicional(is) selecionado(s)`
                : "Buscar e adicionar..."}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar adicional..." />
            <CommandList>
              <CommandEmpty>Nenhum encontrado.</CommandEmpty>
              <CommandGroup>
                {data.map((a) => {
                  const on = (qty[a.id] || 0) > 0;
                  return (
                    <CommandItem
                      key={a.id}
                      value={a.nome}
                      onSelect={() => setQ(a.id, on ? 0 : 1)}
                    >
                      <Check className={cn("h-4 w-4", on ? "opacity-100" : "opacity-0")} />
                      <span className="flex-1 truncate">{a.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatBRL(a.custoPorPeca)}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selecionados.length > 0 && (
        <div className="space-y-1.5">
          {selecionados.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-1.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{a.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBRL(a.custoPorPeca)}/un · {formatBRL(a.custoPorPeca * qty[a.id])}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setQ(a.id, (qty[a.id] || 0) - 1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-6 text-center text-sm font-semibold">{qty[a.id]}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setQ(a.id, (qty[a.id] || 0) + 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => setQ(a.id, 0)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <p className="text-sm font-semibold text-secondary">
            + {formatBRL(total)}/peça em adicionais
          </p>
        </div>
      )}
    </div>
  );
}
