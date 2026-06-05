"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ComboItem {
  value: string;
  label: string;
  sublabel?: string;
}

interface Props {
  items: ComboItem[];
  value: string;
  onSelect: (item: ComboItem) => void;
  placeholder?: string;
  emptyText?: string;
  /** Mostra um item "+ {createLabel}" que dispara onCreate. */
  onCreate?: () => void;
  createLabel?: string;
}

export function Combobox({
  items,
  value,
  onSelect,
  placeholder = "Selecionar...",
  emptyText = "Nada encontrado.",
  onCreate,
  createLabel = "Criar novo",
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          filter={(value, search) => {
            if (value === "__create__") return 1; // sempre visível
            const item = items.find((i) => i.value === value);
            const hay = `${item?.label ?? ""} ${item?.sublabel ?? ""}`.toLowerCase();
            return hay.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Buscar..." />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{item.label}</p>
                    {item.sublabel && (
                      <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreate && (
              <CommandGroup className="border-t border-border">
                <CommandItem
                  value="__create__"
                  onSelect={() => {
                    onCreate();
                    setOpen(false);
                  }}
                  className="text-primary"
                >
                  <Plus className="h-4 w-4" />
                  {createLabel}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
