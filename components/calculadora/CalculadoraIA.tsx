"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResultadoCalculo } from "./ResultadoCalculo";
import { AdicionaisPicker } from "./AdicionaisPicker";
import { CategoriaCombobox } from "@/components/produtos/CategoriaCombobox";
import { useConfig } from "@/hooks/use-config";
import { formatBRL } from "@/lib/format";
import type { PricingResult } from "@/lib/pricing";
import { Calculator, Loader2, Save, History } from "lucide-react";

interface Form {
  nome: string;
  categoria: string;
  pesoGramas: string;
  tempoImpressaoMin: string;
  qtdPorPlaca: string;
  custoFilamentoPorKg: string;
  tarifaEnergiaKwh: string;
  materiaisExtras: string;
  qtdPedido: string;
}

const EMPTY: Form = {
  nome: "",
  categoria: "Personalizado",
  pesoGramas: "",
  tempoImpressaoMin: "",
  qtdPorPlaca: "1",
  custoFilamentoPorKg: "",
  tarifaEnergiaKwh: "",
  materiaisExtras: "",
  qtdPedido: "1",
};

interface HistItem {
  nome: string;
  preco: number;
  data: string;
}

const STORAGE_KEY = "mtmakers_calc_history";

export function CalculadoraIA() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<PricingResult | null>(null);
  const [hist, setHist] = useState<HistItem[]>([]);
  const [addTotal, setAddTotal] = useState(0);
  const { config } = useConfig();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHist(JSON.parse(raw));
    } catch {}
  }, []);

  function set<K extends keyof Form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function calcular() {
    if (!form.nome || !form.pesoGramas || !form.tempoImpressaoMin) {
      toast.error("Preencha nome, peso e tempo de impressão");
      return;
    }
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch("/api/calculadora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          materiaisExtras: (Number(form.materiaisExtras) || 0) + addTotal,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro no cálculo");
      const data: PricingResult = json.data;
      setResultado(data);
      const novo: HistItem = {
        nome: form.nome,
        preco: data.precoSugerido,
        data: new Date().toLocaleString("pt-BR"),
      };
      const updated = [novo, ...hist].slice(0, 8);
      setHist(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      toast.success("Preço calculado");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function salvarComoProduto() {
    if (!resultado) return;
    setSaving(true);
    try {
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peca: form.nome,
          categoria: form.categoria,
          pesoG: Number(form.pesoGramas),
          tempoMin: Number(form.tempoImpressaoMin),
          qtd: Number(form.qtdPorPlaca) || 1,
          pcsPlaca: Number(form.qtdPorPlaca) || 1,
          ...resultado.produto,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar");
      toast.success(`Produto ${json.data.id} criado!`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
      {/* Formulário */}
      <Card className="p-5 shadow-sm border-secondary/30">
        <h2 className="font-semibold text-secondary flex items-center gap-2 mb-1">
          <Calculator className="h-5 w-5" /> Dados da peça
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Padrão: filamento {formatBRL(config.filamentoKg)}/kg · energia{" "}
          {formatBRL(config.energiaKwh)}/kWh · {config.potenciaW}W ·{" "}
          <Link href="/configuracoes" className="text-primary underline">
            ajustar
          </Link>
        </p>
        <div className="space-y-3">
          <Field label="Nome da peça *">
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
          </Field>
          <Field label="Categoria">
            <CategoriaCombobox
              value={form.categoria}
              onChange={(v) => set("categoria", v)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso (g) *">
              <Input
                type="number"
                value={form.pesoGramas}
                onChange={(e) => set("pesoGramas", e.target.value)}
              />
            </Field>
            <Field label="Tempo (min) *">
              <Input
                type="number"
                value={form.tempoImpressaoMin}
                onChange={(e) => set("tempoImpressaoMin", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qtd por placa">
              <Input
                type="number"
                value={form.qtdPorPlaca}
                onChange={(e) => set("qtdPorPlaca", e.target.value)}
              />
            </Field>
            <Field label="Qtd do pedido">
              <Input
                type="number"
                value={form.qtdPedido}
                onChange={(e) => set("qtdPedido", e.target.value)}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Use o <strong>peso e tempo da placa inteira</strong> (do fatiador). O custo é
            dividido pela <strong>Qtd por placa</strong> para dar o valor por peça.
          </p>
          <div>
            <Label className="mb-1 block">Adicionais</Label>
            <AdicionaisPicker onChange={(total) => setAddTotal(total)} />
          </div>
          <Field label="Outros extras manuais (R$/peça)">
            <Input
              type="number"
              placeholder="0,00"
              value={form.materiaisExtras}
              onChange={(e) => set("materiaisExtras", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Filamento R$/kg">
              <Input
                type="number"
                placeholder={String(config.filamentoKg)}
                value={form.custoFilamentoPorKg}
                onChange={(e) => set("custoFilamentoPorKg", e.target.value)}
              />
            </Field>
            <Field label="Energia R$/kWh">
              <Input
                type="number"
                placeholder={String(config.energiaKwh)}
                value={form.tarifaEnergiaKwh}
                onChange={(e) => set("tarifaEnergiaKwh", e.target.value)}
              />
            </Field>
          </div>
          <Button onClick={calcular} disabled={loading} className="w-full mt-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Calculando...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" /> Calcular Preço
              </>
            )}
          </Button>
        </div>

        {hist.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
              <History className="h-4 w-4" /> Últimas calculações
            </h3>
            <ul className="space-y-1 text-sm">
              {hist.map((h, i) => (
                <li key={i} className="flex justify-between text-muted-foreground">
                  <span className="truncate">{h.nome}</span>
                  <span className="font-medium text-foreground">{formatBRL(h.preco)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Resultado */}
      <div>
        {resultado ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={salvarComoProduto} disabled={saving} variant="secondary">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar como Produto
              </Button>
            </div>
            <ResultadoCalculo r={resultado} />
          </div>
        ) : (
          <Card className="p-12 grid place-items-center text-center text-muted-foreground shadow-sm">
            <Calculator className="h-10 w-10 mb-3 text-secondary/40" />
            <p>Preencha os dados e clique em &ldquo;Calcular Preço&rdquo;.</p>
            <p className="text-sm mt-1">
              Cálculo instantâneo com os custos reais da MT Makers.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
