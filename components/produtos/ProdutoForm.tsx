"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import type { Produto } from "@/types";
import { Calculator, Loader2 } from "lucide-react";
import { AdicionaisPicker } from "@/components/calculadora/AdicionaisPicker";
import { CategoriaCombobox } from "@/components/produtos/CategoriaCombobox";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  produto?: Produto | null;
  onSaved: (created?: Produto) => void;
  extraCategorias?: string[];
}

interface State {
  peca: string;
  categoria: string;
  pesoG: string;
  tempoMin: string;
  qtd: string;
  custoPc: string;
  preco50: string;
  preco70: string;
  comDesc10: string;
  comNota6: string;
}

function init(p?: Produto | null): State {
  return {
    peca: p?.peca || "",
    categoria: p?.categoria || "Personalizado",
    pesoG: p ? String(p.pesoG) : "",
    tempoMin: p ? String(p.tempoMin) : "",
    qtd: p ? String(p.qtd) : "1",
    custoPc: p?.custoPc ? String(p.custoPc) : "",
    preco50: p?.preco50 ? String(p.preco50) : "",
    preco70: p?.preco70 ? String(p.preco70) : "",
    comDesc10: p?.comDesc10 ? String(p.comDesc10) : "",
    comNota6: p?.comNota6 ? String(p.comNota6) : "",
  };
}

export function ProdutoForm({
  open,
  onOpenChange,
  produto,
  onSaved,
  extraCategorias = [],
}: Props) {
  const [s, setS] = useState<State>(init(produto));
  const [calc, setCalc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addTotal, setAddTotal] = useState(0);

  function set<K extends keyof State>(k: K, v: string) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  async function calcularIA() {
    if (!s.peca || !s.pesoG || !s.tempoMin) {
      toast.error("Preencha peça, peso e tempo antes de calcular");
      return;
    }
    setCalc(true);
    try {
      const res = await fetch("/api/calculadora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: s.peca,
          categoria: s.categoria,
          pesoGramas: Number(s.pesoG),
          tempoImpressaoMin: Number(s.tempoMin),
          qtdPorPlaca: Number(s.qtd) || 1,
          materiaisExtras: addTotal,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro no cálculo");
      const p = json.data.produto;
      setS((prev) => ({
        ...prev,
        custoPc: String(p.custoPc),
        preco50: String(p.preco50),
        preco70: String(p.preco70),
        comDesc10: String(p.comDesc10),
        comNota6: String(p.comNota6),
      }));
      toast.success("Preços calculados");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCalc(false);
    }
  }

  async function salvar() {
    if (!s.peca || !s.categoria) {
      toast.error("Peça e categoria são obrigatórias");
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(produto?.rowNumber && produto.rowNumber > 0);
      const payload = {
        ...(isEdit ? produto : {}),
        peca: s.peca,
        categoria: s.categoria,
        pesoG: Number(s.pesoG) || 0,
        tempoMin: Number(s.tempoMin) || 0,
        qtd: Number(s.qtd) || 0,
        pcsPlaca: Number(s.qtd) || 0,
        custoPc: Number(s.custoPc) || 0,
        preco50: Number(s.preco50) || 0,
        preco70: Number(s.preco70) || 0,
        comDesc10: Number(s.comDesc10) || 0,
        comNota6: Number(s.comNota6) || 0,
      };
      const res = await fetch("/api/produtos", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar");
      toast.success(isEdit ? "Produto atualizado" : "Produto cadastrado");
      onOpenChange(false);
      onSaved(isEdit ? undefined : (json.data as Produto));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{produto ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Nome da peça *</Label>
            <Input value={s.peca} onChange={(e) => set("peca", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">Categoria *</Label>
            <CategoriaCombobox
              value={s.categoria}
              onChange={(v) => set("categoria", v)}
              extra={extraCategorias}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="mb-1 block">Peso (g) *</Label>
              <Input type="number" value={s.pesoG} onChange={(e) => set("pesoG", e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Tempo (min) *</Label>
              <Input
                type="number"
                value={s.tempoMin}
                onChange={(e) => set("tempoMin", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block">Qtd/placa</Label>
              <Input type="number" value={s.qtd} onChange={(e) => set("qtd", e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Adicionais</Label>
            <AdicionaisPicker onChange={(total) => setAddTotal(total)} />
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={calcularIA}
            disabled={calc}
            className="w-full"
          >
            {calc ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Calculando...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" /> Calcular preço
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3">
            <PriceField label="Custo/pç" value={s.custoPc} onChange={(v) => set("custoPc", v)} />
            <PriceField
              label="50% (padrão)"
              value={s.preco50}
              onChange={(v) => set("preco50", v)}
              highlight
            />
            <PriceField label="70%" value={s.preco70} onChange={(v) => set("preco70", v)} />
            <PriceField label="c/ desc. 10%" value={s.comDesc10} onChange={(v) => set("comDesc10", v)} />
            <PriceField label="c/ nota +6%" value={s.comNota6} onChange={(v) => set("comNota6", v)} />
          </div>
          {s.preco50 && (
            <p className="text-sm text-secondary font-semibold text-center">
              Preço de venda (50%): {formatBRL(Number(s.preco50))}
            </p>
          )}
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

function PriceField({
  label,
  value,
  onChange,
  highlight,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  highlight?: boolean;
}) {
  return (
    <div>
      <Label className={`mb-1 block text-xs ${highlight ? "text-secondary font-semibold" : ""}`}>
        {label}
      </Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={highlight ? "border-secondary" : ""}
      />
    </div>
  );
}
