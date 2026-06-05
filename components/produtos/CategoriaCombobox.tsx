"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import { PRODUTO_CATEGORIAS } from "@/lib/constants";

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Categorias já usadas nos produtos (além das padrão). */
  extra?: string[];
}

export function CategoriaCombobox({ value, onChange, extra = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const todas = Array.from(
    new Set([...PRODUTO_CATEGORIAS, ...extra, value].filter(Boolean))
  ) as string[];

  const q = search.trim();
  const filtradas = q
    ? todas.filter((c) => c.toLowerCase().includes(q.toLowerCase()))
    : todas;
  const existeExata = todas.some((c) => c.toLowerCase() === q.toLowerCase());

  function escolher(v: string) {
    onChange(v);
    setSearch("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          <span className={value ? "" : "text-muted-foreground"}>
            {value || "Selecione ou digite..."}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar ou criar categoria..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtradas.length === 0 && !q && (
              <CommandEmpty>Digite para criar uma categoria.</CommandEmpty>
            )}
            <CommandGroup>
              {filtradas.map((c) => (
                <CommandItem key={c} value={c} onSelect={() => escolher(c)}>
                  <Check
                    className={cn("h-4 w-4", value === c ? "opacity-100" : "opacity-0")}
                  />
                  {c}
                </CommandItem>
              ))}
              {q && !existeExata && (
                <CommandItem value={`__criar_${q}`} onSelect={() => escolher(q)}>
                  <Plus className="h-4 w-4" />
                  Criar &ldquo;{q}&rdquo;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
