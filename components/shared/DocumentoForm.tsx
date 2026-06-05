"use client";

import { useState } from "react";
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
import { ItensEditor, ITEM_VAZIO, type ItemForm } from "@/components/shared/ItensEditor";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { ProdutoForm } from "@/components/produtos/ProdutoForm";
import { useCollection } from "@/hooks/use-collection";
import { useConfig } from "@/hooks/use-config";
import { PEDIDO_STATUS, ORCAMENTO_STATUS, FORMAS_PGTO } from "@/lib/constants";
import { serializeItens } from "@/lib/itens";
import { formatBRL, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Cliente, Produto } from "@/types";
import { Loader2, User, Package, TrendingUp, Wallet, Truck } from "lucide-react";

const isoToBR = (s: string) => (s ? s.split("-").reverse().join("/") : "");
function hojeMais(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function DocumentoForm({ tipo }: { tipo: "pedido" | "orcamento" }) {
  const router = useRouter();
  const isOrc = tipo === "orcamento";
  const { data: clientes, refetch: refetchClientes } = useCollection<Cliente>("/api/clientes");
  const { data: produtos, refetch: refetchProdutos } = useCollection<Produto>("/api/produtos");
  const { config } = useConfig();

  const [saving, setSaving] = useState(false);
  const [clienteFormOpen, setClienteFormOpen] = useState(false);
  const [produtoFormOpen, setProdutoFormOpen] = useState(false);

  const [idCliente, setIdCliente] = useState("");
  const [cliente, setCliente] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([{ ...ITEM_VAZIO }]);
  const [data, setData] = useState("");
  const [data3, setData3] = useState(isOrc ? hojeMais(7) : ""); // validade (orc) ou entrega (ped)
  const [entradaPaga, setEntradaPaga] = useState("0");
  const [formaPgto, setFormaPgto] = useState("Pendente");
  const [status, setStatus] = useState(isOrc ? "Aberto" : "Aguardando confirmação");
  const [endereco, setEndereco] = useState("");
  const [obs, setObs] = useState("");

  const clienteItems: ComboItem[] = clientes.map((c) => ({
    value: c.id,
    label: c.nome,
    sublabel: `${c.id} · ${c.cidade}`,
  }));

  const total = itens.reduce(
    (a, i) => a + (Number(i.qtd) || 0) * (Number(i.valorUnit) || 0),
    0
  );
  const custoTotal = itens.reduce((a, i) => {
    const p = produtos.find((x) => x.peca === i.produto);
    return a + (Number(i.qtd) || 0) * (p?.custoPc ?? 0);
  }, 0);
  const lucro = total - custoTotal;
  const margem = total > 0 ? (lucro / total) * 100 : 0;
  const restante = total - (Number(entradaPaga) || 0);

  async function submit() {
    const validos = itens.filter((i) => i.produto && Number(i.qtd) > 0);
    if (!cliente) return toast.error("Selecione o cliente");
    if (validos.length === 0) return toast.error("Adicione ao menos um produto");

    const produtosStr = serializeItens(
      validos.map((i) => ({
        produto: i.produto,
        qtd: Number(i.qtd),
        valorUnit: Number(i.valorUnit) || 0,
      }))
    );
    const qtdTotal = validos.reduce((a, i) => a + (Number(i.qtd) || 0), 0);
    const dataBR = isoToBR(data);
    const data3BR = isoToBR(data3);

    setSaving(true);
    try {
      const endpoint = isOrc ? "/api/orcamentos" : "/api/pedidos";
      const payload = isOrc
        ? {
            idCliente,
            cliente,
            produtos: produtosStr,
            qtd: qtdTotal,
            total,
            data: dataBR || undefined,
            validade: data3BR || undefined,
            enderecoEntrega: endereco,
            entradaPaga: Number(entradaPaga) || 0,
            formaPgto,
            status,
            observacoes: obs,
          }
        : {
            idCliente,
            cliente,
            produto: produtosStr,
            qtd: qtdTotal,
            precoUnit: 0,
            total,
            data: dataBR || undefined,
            dataEntrega: data3BR,
            enderecoEntrega: endereco,
            entradaPaga: Number(entradaPaga) || 0,
            formaPgto,
            status,
            observacoes: obs,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar");
      const novoId = json.data.id;
      toast.success(`${isOrc ? "Orçamento" : "Pedido"} ${novoId} criado!`);

      // Gera o PDF
      try {
        if (isOrc) {
          const { gerarOrcamentoPDF } = await import("@/lib/orcamento-pdf");
          await gerarOrcamentoPDF(
            {
              rowNumber: -1,
              seq: "",
              id: novoId,
              idCliente,
              data: dataBR || new Date().toLocaleDateString("pt-BR"),
              cliente,
              produtos: produtosStr,
              enderecoEntrega: endereco,
              qtd: qtdTotal,
              total,
              entradaPaga: Number(entradaPaga) || 0,
              restante,
              formaPgto,
              validade: data3BR,
              status,
              observacoes: obs,
            },
            config
          );
        } else {
          const { gerarPedidoPDF } = await import("@/lib/pedido-pdf");
          await gerarPedidoPDF(
            {
              id: novoId,
              cliente,
              produto: produtosStr,
              data: dataBR,
              dataEntrega: data3BR,
              qtd: qtdTotal,
              precoUnit: 0,
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
        }
      } catch (pdfErr) {
        toast.error("Criado, mas falhou o PDF: " + (pdfErr as Error).message);
      }

      router.push(isOrc ? "/orcamentos" : "/pedidos");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
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

      <Secao titulo="Produtos" icon={Package}>
        <ItensEditor
          itens={itens}
          onChange={setItens}
          produtos={produtos}
          onCreateProduto={() => setProdutoFormOpen(true)}
        />
      </Secao>

      {total > 0 && (
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
        </Secao>
      )}

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

      <Secao titulo={isOrc ? "Validade e detalhes" : "Entrega e detalhes"} icon={Truck}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label={isOrc ? "Data do orçamento" : "Data do pedido"}>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
          <Campo label={isOrc ? "Válido até" : "Data de entrega"}>
            <Input type="date" value={data3} onChange={(e) => setData3(e.target.value)} />
          </Campo>
          <Campo label="Status">
            <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(isOrc ? ORCAMENTO_STATUS : PEDIDO_STATUS).map((s) => (
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
        <Button variant="outline" onClick={() => router.push(isOrc ? "/orcamentos" : "/pedidos")}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isOrc ? "Criar orçamento" : "Criar pedido"}
        </Button>
      </div>

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
        onSaved={() => refetchProdutos()}
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
