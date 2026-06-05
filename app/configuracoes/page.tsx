"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useConfig, depreciacaoHora, type Config } from "@/hooks/use-config";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";

const MARKUPS = [50, 60, 70, 80, 100, 120, 150];

export default function ConfiguracoesPage() {
  const { config, loaded, save, reset } = useConfig();
  const [form, setForm] = useState<Config>(config);

  useEffect(() => {
    if (loaded) setForm(config);
  }, [loaded, config]);

  function set<K extends keyof Config>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: Number(v) || 0 }));
  }
  function setStr<K extends keyof Config>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const [saving, setSaving] = useState(false);

  async function salvar() {
    setSaving(true);
    try {
      await save(form);
      toast.success("Configurações salvas");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const deprec = depreciacaoHora(form);

  return (
    <>
      <Header
        title="Configurações"
        subtitle="Custos padrão usados na precificação"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={saving}
              onClick={async () => {
                try {
                  await reset();
                  toast.success("Restaurado para o padrão MT Makers");
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              <RotateCcw className="h-4 w-4" /> Restaurar padrão
            </Button>
            <Button onClick={salvar} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        }
      />
      <PageContainer>
        <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
          {/* Custos de produção */}
          <Card className="p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Custos de produção</h2>
            <div className="space-y-4">
              <Campo
                label="Filamento (R$/kg)"
                value={form.filamentoKg}
                onChange={(v) => set("filamentoKg", v)}
              />
              <Campo
                label="Energia elétrica (R$/kWh)"
                value={form.energiaKwh}
                onChange={(v) => set("energiaKwh", v)}
                step="0.01"
              />
              <Campo
                label="Potência da impressora (W)"
                value={form.potenciaW}
                onChange={(v) => set("potenciaW", v)}
              />
            </div>
          </Card>

          {/* Impressora / depreciação */}
          <Card className="p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Impressora</h2>
            <div className="space-y-4">
              <Campo
                label="Custo da impressora (R$)"
                value={form.custoImpressora}
                onChange={(v) => set("custoImpressora", v)}
              />
              <Campo
                label="Vida útil (horas)"
                value={form.vidaUtilHoras}
                onChange={(v) => set("vidaUtilHoras", v)}
              />
              <div className="rounded-lg bg-accent px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Depreciação por hora</span>
                <span className="font-bold text-primary">{formatBRL(deprec)}/h</span>
              </div>
            </div>
          </Card>

          {/* Operacional */}
          <Card className="p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Operacional</h2>
            <div className="space-y-4">
              <Campo
                label="Valor da hora de trabalho (R$/h)"
                value={form.valorHora}
                onChange={(v) => set("valorHora", v)}
              />
              <Campo
                label="Manuseio por rodada (min)"
                value={form.manuseioMin}
                onChange={(v) => set("manuseioMin", v)}
              />
              <div>
                <Label className="mb-1.5 block">Markup padrão (%)</Label>
                <div className="flex flex-wrap gap-2">
                  {MARKUPS.map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setForm((f) => ({ ...f, margemPadrao: m }))}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        form.margemPadrao === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {m}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Negócio */}
          <Card className="p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Negócio</h2>
            <div className="space-y-4">
              <Campo
                label="Meta mensal de faturamento (R$)"
                value={form.metaMensal}
                onChange={(v) => set("metaMensal", v)}
              />
              <p className="text-xs text-muted-foreground">
                Usada na barra de progresso do Dashboard.
              </p>
            </div>
          </Card>

          {/* Pagamento (PIX) */}
          <Card className="p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Pagamento (PIX)</h2>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Chave PIX</Label>
                <Input
                  value={form.chavePix}
                  onChange={(e) => setStr("chavePix", e.target.value)}
                  placeholder="e-mail, CPF/CNPJ, telefone ou aleatória"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Recebedor (nome)</Label>
                  <Input
                    value={form.recebedorNome}
                    onChange={(e) => setStr("recebedorNome", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">Cidade</Label>
                  <Input
                    value={form.recebedorCidade}
                    onChange={(e) => setStr("recebedorCidade", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Usado para gerar o QR Code do PIX no PDF do pedido.
              </p>
            </div>
          </Card>

          {/* Observações do pedido */}
          <Card className="p-5 shadow-sm lg:col-span-2">
            <h2 className="font-semibold text-foreground mb-4">Observações do pedido (PDF)</h2>
            <Textarea
              value={form.obsPedido}
              onChange={(e) => setStr("obsPedido", e.target.value)}
              rows={5}
              placeholder="Prazo, aprovação de personalizados, política de pagamento..."
            />
            <p className="text-xs text-muted-foreground mt-2">
              Uma linha por observação. Aparecem no PDF de cada pedido.
            </p>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground mt-4 max-w-4xl">
          As configurações ficam salvas na planilha (aba Config) e são aplicadas na Calculadora
          e no cadastro de Produtos.
        </p>
      </PageContainer>
    </>
  );
}

function Campo({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
