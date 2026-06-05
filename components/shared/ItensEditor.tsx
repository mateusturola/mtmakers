"use client";

import { Combobox, type ComboItem } from "@/components/shared/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import type { Produto } from "@/types";
import { Plus, Trash2 } from "lucide-react";

export interface ItemForm {
  produto: string;
  qtd: string;
  valorUnit: string;
}

export const ITEM_VAZIO: ItemForm = { produto: "", qtd: "1", valorUnit: "" };

interface Props {
  itens: ItemForm[];
  onChange: (itens: ItemForm[]) => void;
  produtos: Produto[];
  onCreateProduto?: () => void;
}

export function ItensEditor({ itens, onChange, produtos, onCreateProduto }: Props) {
  const produtoItems: ComboItem[] = produtos.map((p) => ({
    value: p.id,
    label: p.peca,
    sublabel: `${p.id} · ${formatBRL(p.preco50)}`,
  }));

  function set(idx: number, patch: Partial<ItemForm>) {
    onChange(itens.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function add() {
    onChange([...itens, { ...ITEM_VAZIO }]);
  }
  function remove(idx: number) {
    onChange(itens.length > 1 ? itens.filter((_, i) => i !== idx) : itens);
  }

  const total = itens.reduce(
    (acc, i) => acc + (Number(i.qtd) || 0) * (Number(i.valorUnit) || 0),
    0
  );

  return (
    <div className="space-y-2">
      {itens.map((it, idx) => {
        const sub = (Number(it.qtd) || 0) * (Number(it.valorUnit) || 0);
        return (
          <div
            key={idx}
            className="grid grid-cols-[1fr_60px_92px_auto] gap-2 items-end rounded-lg border border-border p-2"
          >
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Produto</Label>
              <Combobox
                items={produtoItems}
                value={produtos.find((p) => p.peca === it.produto)?.id ?? ""}
                onSelect={(i) => {
                  const p = produtos.find((x) => x.id === i.value);
                  set(idx, {
                    produto: i.label,
                    valorUnit: p?.preco50 ? String(p.preco50) : it.valorUnit,
                  });
                }}
                placeholder="Produto..."
                onCreate={onCreateProduto}
                createLabel="Criar novo produto"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Qtd</Label>
              <Input
                type="number"
                value={it.qtd}
                onChange={(e) => set(idx, { qtd: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Valor un.</Label>
              <Input
                type="number"
                value={it.valorUnit}
                onChange={(e) => set(idx, { valorUnit: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive"
              onClick={() => remove(idx)}
              title="Remover"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <p className="col-span-4 text-right text-xs text-muted-foreground -mt-1">
              Subtotal: {formatBRL(sub)}
            </p>
          </div>
        );
      })}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-3.5 w-3.5" /> Adicionar produto
        </Button>
        <span className="text-sm font-semibold text-primary">
          Total: {formatBRL(total)}
        </span>
      </div>
    </div>
  );
}
