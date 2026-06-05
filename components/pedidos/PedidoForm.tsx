"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboItem } from "@/components/shared/Combobox";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { ProdutoForm } from "@/components/produtos/ProdutoForm";
import { useCollection } from "@/hooks/use-collection";
import { useConfig } from "@/hooks/use-config";
import { PEDIDO_STATUS, FORMAS_PGTO } from "@/lib/constants";
import { formatBRL, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Cliente, Produto } from "@/types";
import {
  Loader2,
  User,
  Package,
  TrendingUp,
  Wallet,
  Truck,
} from "lucide-react";

export function PedidoForm() {
  const router = useRouter();
  const { data: clientes, refetch: refetchClientes } =
    useCollection<Cliente>("/api/clientes");
  const { data: produtos, refetch: refetchProdutos } =
    useCollection<Produto>("/api/produtos");
  const { config } = useConfig();
  const [saving, setSaving] = useState(false);
  const [clienteFormOpen, setClienteFormOpen] = useState(false);
  const [produtoFormOpen, setProdutoFormOpen] = useState(false);

  const [idCliente, setIdCliente] = useState("");
  const [cliente, setCliente] = useState("");
  const [idProduto, setIdProduto] = useState("");
  const [produto, setProduto] = useState("");
  const [data, setData] = useState("");
  const [qtd, setQtd] = useState("1");
  const [precoUnit, setPrecoUnit] = useState("");
  const [entradaPaga, setEntradaPaga] = useState("0");
  const [formaPgto, setFormaPgto] = useState("Pendente");
  const [dataEntrega, setDataEntrega] = useState("");
  const [status, setStatus] = useState("Aguardando confirmação");
  const [endereco, setEndereco] = useState("");
  const [obs, setObs] = useState("");

  const clienteItems: ComboItem[] = useMemo(
    () => clientes.map((c) => ({ value: c.id, label: c.nome, sublabel: `${c.id} · ${c.cidade}` })),
    [clientes]
  );
  const produtoItems: ComboItem[] = useMemo(
    () =>
      produtos.map((p) => ({
        value: p.id,
        label: p.peca,
        sublabel: `${p.id} · ${formatBRL(p.preco50)}`,
      })),
    [produtos]
  );

  const prodSel = produtos.find((p) => p.id === idProduto);
  const nQtd = Number(qtd) || 0;
  const nPreco = Number(precoUnit) || 0;
  const custoUnit = prodSel?.custoPc ?? 0;

  const total = nQtd * nPreco;
  const custoTotal = nQtd * custoUnit;
  const lucro = total - custoTotal;
  const margem = total > 0 ? (lucro / total) * 100 : 0;
  const restante = total - (Number(entradaPaga) || 0);

  async function submit() {
    if (!cliente || !produto || !qtd) {
      toast.error("Cliente, produto e quantidade são obrigatórios");
      return;
    }
    setSaving(true);
    const dataBR = data ? data.split("-").reverse().join("/") : undefined;
    const entregaBR = dataEntrega ? dataEntrega.split("-").reverse().join("/") : "";
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCliente,
          cliente,
          produto,
          data: dataBR,
          enderecoEntrega: endereco,
          qtd: Number(qtd),
          precoUnit: nPreco,
          entradaPaga: Number(entradaPaga) || 0,
          formaPgto,
          dataEntrega: entregaBR,
          status,
          observacoes: obs,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar");
      toast.success(`Pedido ${json.data.id} criado!`);

      // Gera o PDF do pedido (com QR do PIX) automaticamente.
      try {
        const { gerarPedidoPDF } = await import("@/lib/pedido-pdf");
        await gerarPedidoPDF(
          {
            id: json.data.id,
            cliente,
            produto,
            data: dataBR,
            dataEntrega: entregaBR,
            qtd: nQtd,
            precoUnit: nPreco,
            total,
            entradaPaga: Number(entradaPaga) || 0,
            restante,
            formaPgto,
            status,
            enderecoEntrega: endereco,
            observacoes: obs,
          },
          config
        );
      } catch (pdfErr) {
        toast.error("Pedido criado, mas falhou ao gerar o PDF: " + (pdfErr as Error).message);
      }

      router.push("/pedidos");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Cliente */}
      <Secao titulo="Cliente" icon={User}>
        <Combobox
          items={clienteItems}
          value={idCliente}
          onSelect={(i) => {
            setIdCliente(i.value);
            setCliente(i.label);
          }}
          placeholder="Buscar cliente..."
          onCreate={() => setClienteFormOpen(true)}
          createLabel="Criar novo cliente"
        />
      </Secao>

      {/* Produto e valores */}
      <Secao titulo="Produto e valores" icon={Package}>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Produto *</Label>
            <Combobox
              items={produtoItems}
              value={idProduto}
              onSelect={(i) => {
                setIdProduto(i.value);
                setProduto(i.label);
                const p = produtos.find((x) => x.id === i.value);
                if (p?.preco50) setPrecoUnit(String(p.preco50));
              }}
              placeholder="Buscar produto..."
              onCreate={() => setProdutoFormOpen(true)}
              createLabel="Criar novo produto"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Campo label="Quantidade *">
              <Input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} />
            </Campo>
            <Campo label="Preço unitário (R$)">
              <Input
                type="number"
                value={precoUnit}
                onChange={(e) => setPrecoUnit(e.target.value)}
              />
            </Campo>
          </div>
        </div>
      </Secao>

      {/* Resumo financeiro / lucro */}
      {prodSel && (
        <Secao titulo="Resumo financeiro" icon={TrendingUp} highlight>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Indicador label="Total" valor={formatBRL(total)} />
            <Indicador label="Custo total" valor={formatBRL(custoTotal)} />
            <Indicador
              label="Lucro"
              valor={formatBRL(lucro)}
              cor={lucro < 0 ? "text-destructive" : "text-[#1b7a3d]"}
            />
            <Indicador
              label="Margem"
              valor={formatPercent(margem)}
              cor={lucro < 0 ? "text-destructive" : "text-[#1b7a3d]"}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Custo unitário do produto: {formatBRL(custoUnit)} · preço de venda{" "}
            {formatBRL(nPreco)}/un.
          </p>
        </Secao>
      )}

      {/* Pagamento */}
      <Secao titulo="Pagamento" icon={Wallet}>
        <div className="grid sm:grid-cols-3 gap-4">
          <Campo label="Entrada paga (R$)">
            <Input
              type="number"
              value={entradaPaga}
              onChange={(e) => setEntradaPaga(e.target.value)}
            />
          </Campo>
          <Campo label="Forma de pagamento">
            <Select value={formaPgto} onValueChange={(v) => setFormaPgto(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_PGTO.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <div>
            <Label className="mb-1.5 block">Restante</Label>
            <div className="h-9 flex items-center font-semibold text-secondary">
              {formatBRL(restante)}
            </div>
          </div>
        </div>
      </Secao>

      {/* Entrega e detalhes */}
      <Secao titulo="Entrega e detalhes" icon={Truck}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="Data do pedido">
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
          <Campo label="Data de entrega">
            <Input
              type="date"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
            />
          </Campo>
          <Campo label="Status">
            <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PEDIDO_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo label="Endereço de entrega">
            <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </Campo>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Observações</Label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
          </div>
        </div>
      </Secao>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/pedidos")}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Criar pedido
        </Button>
      </div>

      {/* Dialogs de criação rápida */}
      <ClienteForm
        open={clienteFormOpen}
        onOpenChange={setClienteFormOpen}
        onSaved={(c) => {
          refetchClientes();
          if (c) {
            setIdCliente(c.id);
            setCliente(c.nome);
          }
        }}
      />
      <ProdutoForm
        open={produtoFormOpen}
        onOpenChange={setProdutoFormOpen}
        produto={null}
        onSaved={(p) => {
          refetchProdutos();
          if (p) {
            setIdProduto(p.id);
            setProduto(p.peca);
            if (p.preco50) setPrecoUnit(String(p.preco50));
          }
        }}
      />
    </div>
  );
}

function Secao({
  titulo,
  icon: Icon,
  children,
  highlight,
}: {
  titulo: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={cn("p-5 shadow-sm", highlight && "border-secondary/40 bg-accent/40")}>
      <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-secondary" />
        {titulo}
      </h2>
      {children}
    </Card>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function Indicador({
  label,
  valor,
  cor = "text-primary",
}: {
  label: string;
  valor: string;
  cor?: string;
}) {
  return (
    <div className="rounded-lg bg-card border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold", cor)}>{valor}</p>
    </div>
  );
}
