import {
  readSheet,
  appendRow,
  updateRow,
  clearRange,
  parseNumber,
  str,
  nextId,
  hojeBR,
} from "./sheets";
import { SHEETS, dataRange, type SheetKey } from "./sheets-config";
import { META_MENSAL } from "./constants";
import {
  DEFAULT_CONFIG,
  CONFIG_NUM_KEYS,
  CONFIG_STR_KEYS,
  type Config,
} from "./config";
import type {
  Cliente,
  Produto,
  Pedido,
  Consignado,
  Retirada,
  Entrada,
  Adicional,
  DashboardData,
} from "@/types";

// rowNumber = primeira linha de dados + índice na matriz lida.
function rowNum(key: SheetKey, index: number): number {
  return SHEETS[key].firstDataRow + index;
}

function isEmptyRow(row: string[]): boolean {
  return !row || row.every((c) => str(c) === "");
}

// ===================== CLIENTES =====================

export async function listClientes(): Promise<Cliente[]> {
  const rows = await readSheet(dataRange("Clientes"));
  return rows
    .map((r, i) => ({ r, rowNumber: rowNum("Clientes", i) }))
    .filter(({ r }) => !isEmptyRow(r) && str(r[1]) !== "")
    .map(({ r, rowNumber }) => ({
      rowNumber,
      seq: str(r[0]),
      id: str(r[1]),
      nome: str(r[2]),
      whatsapp: str(r[3]),
      tipo: str(r[4]),
      cidade: str(r[5]),
      cadastradoEm: str(r[6]),
      observacoes: str(r[7]),
    }));
}

export async function createCliente(input: {
  nome: string;
  whatsapp: string;
  tipo: string;
  cidade?: string;
  observacoes?: string;
}): Promise<Cliente> {
  const existing = await listClientes();
  const id = nextId("CLI", existing.map((c) => c.id));
  const seq = existing.length + 1;
  const row = [
    seq,
    id,
    input.nome,
    input.whatsapp,
    input.tipo,
    input.cidade || "",
    hojeBR(),
    input.observacoes || "",
  ];
  await appendRow(dataRange("Clientes"), [row]);
  return {
    rowNumber: -1,
    seq: String(seq),
    id,
    nome: input.nome,
    whatsapp: input.whatsapp,
    tipo: input.tipo,
    cidade: input.cidade || "",
    cadastradoEm: hojeBR(),
    observacoes: input.observacoes || "",
  };
}

export async function updateCliente(
  rowNumber: number,
  input: Partial<Cliente>
): Promise<void> {
  const all = await listClientes();
  const current = all.find((c) => c.rowNumber === rowNumber);
  if (!current) throw new Error("Cliente não encontrado");
  const merged = { ...current, ...input };
  const row = [
    merged.seq,
    merged.id,
    merged.nome,
    merged.whatsapp,
    merged.tipo,
    merged.cidade,
    merged.cadastradoEm,
    merged.observacoes,
  ];
  await updateRow(`${SHEETS.Clientes.name}!A${rowNumber}:H${rowNumber}`, [row]);
}

export async function deleteCliente(rowNumber: number): Promise<void> {
  await clearRange(`${SHEETS.Clientes.name}!A${rowNumber}:H${rowNumber}`);
}

// ===================== PRODUTOS =====================

export async function listProdutos(): Promise<Produto[]> {
  const rows = await readSheet(dataRange("Produtos"));
  return rows
    .map((r, i) => ({ r, rowNumber: rowNum("Produtos", i) }))
    .filter(({ r }) => !isEmptyRow(r) && str(r[1]) !== "")
    .map(({ r, rowNumber }) => ({
      rowNumber,
      seq: str(r[0]),
      id: str(r[1]),
      data: str(r[2]),
      peca: str(r[3]),
      categoria: str(r[4]),
      pesoG: parseNumber(r[5]),
      tempoMin: parseNumber(r[6]),
      qtd: parseNumber(r[7]),
      pcsPlaca: parseNumber(r[8]),
      custoPc: parseNumber(r[9]),
      preco50: parseNumber(r[10]),
      preco60: parseNumber(r[11]),
      preco70: parseNumber(r[12]),
      preco80: parseNumber(r[13]),
      comDesc10: parseNumber(r[14]),
      comNota6: parseNumber(r[15]),
      margem: parseNumber(r[16]),
      totalVenda: parseNumber(r[17]),
    }));
}

export interface ProdutoInput {
  peca: string;
  categoria: string;
  pesoG: number;
  tempoMin: number;
  qtd?: number;
  pcsPlaca?: number;
  custoPc?: number;
  preco50?: number;
  preco60?: number;
  preco70?: number;
  preco80?: number;
  comDesc10?: number;
  comNota6?: number;
  margem?: number;
  totalVenda?: number;
}

function produtoRow(seq: number | string, id: string, data: string, p: ProdutoInput) {
  return [
    seq,
    id,
    data,
    p.peca,
    p.categoria,
    p.pesoG,
    p.tempoMin,
    p.qtd ?? "",
    p.pcsPlaca ?? "",
    p.custoPc ?? "",
    p.preco50 ?? "",
    p.preco60 ?? "",
    p.preco70 ?? "",
    p.preco80 ?? "",
    p.comDesc10 ?? "",
    p.comNota6 ?? "",
    p.margem ?? "",
    p.totalVenda ?? "",
  ];
}

export async function createProduto(input: ProdutoInput): Promise<Produto> {
  const existing = await listProdutos();
  const id = nextId("MTK", existing.map((p) => p.id));
  const seq = existing.length + 1;
  const data = hojeBR();
  await appendRow(dataRange("Produtos"), [produtoRow(seq, id, data, input)]);
  return {
    rowNumber: -1,
    seq: String(seq),
    id,
    data,
    peca: input.peca,
    categoria: input.categoria,
    pesoG: input.pesoG,
    tempoMin: input.tempoMin,
    qtd: input.qtd ?? 0,
    pcsPlaca: input.pcsPlaca ?? 0,
    custoPc: input.custoPc ?? 0,
    preco50: input.preco50 ?? 0,
    preco60: input.preco60 ?? 0,
    preco70: input.preco70 ?? 0,
    preco80: input.preco80 ?? 0,
    comDesc10: input.comDesc10 ?? 0,
    comNota6: input.comNota6 ?? 0,
    margem: input.margem ?? 0,
    totalVenda: input.totalVenda ?? 0,
  };
}

export async function updateProduto(
  rowNumber: number,
  input: Partial<Produto>
): Promise<void> {
  const all = await listProdutos();
  const current = all.find((p) => p.rowNumber === rowNumber);
  if (!current) throw new Error("Produto não encontrado");
  const m = { ...current, ...input };
  const row = produtoRow(m.seq, m.id, m.data, m);
  await updateRow(`${SHEETS.Produtos.name}!A${rowNumber}:R${rowNumber}`, [row]);
}

// ===================== PEDIDOS =====================

export async function listPedidos(): Promise<Pedido[]> {
  const rows = await readSheet(dataRange("Pedidos"));
  return rows
    .map((r, i) => ({ r, rowNumber: rowNum("Pedidos", i) }))
    // Ignora linha TOTAIS e linhas sem ID/seq.
    .filter(
      ({ r }) =>
        !isEmptyRow(r) &&
        str(r[0]) !== "" &&
        str(r[0]).toUpperCase() !== "TOTAIS" &&
        str(r[1]) !== ""
    )
    .map(({ r, rowNumber }) => ({
      rowNumber,
      seq: str(r[0]),
      id: str(r[1]),
      idCliente: str(r[2]),
      data: str(r[3]),
      cliente: str(r[4]),
      produto: str(r[5]),
      enderecoEntrega: str(r[6]),
      qtd: parseNumber(r[7]),
      precoUnit: parseNumber(r[8]),
      total: parseNumber(r[9]),
      entradaPaga: parseNumber(r[10]),
      restante: parseNumber(r[11]),
      formaPgto: str(r[12]),
      dataEntrega: str(r[13]),
      status: str(r[14]),
      observacoes: str(r[15]),
    }));
}

export interface PedidoInput {
  idCliente: string;
  cliente: string;
  produto: string;
  data?: string;
  enderecoEntrega?: string;
  qtd: number;
  precoUnit: number;
  entradaPaga?: number;
  formaPgto?: string;
  dataEntrega?: string;
  status?: string;
  observacoes?: string;
}

function pedidoRow(seq: number | string, id: string, p: PedidoInput) {
  const total = p.qtd * p.precoUnit;
  const entrada = p.entradaPaga || 0;
  const restante = total - entrada;
  return [
    seq,
    id,
    p.idCliente,
    p.data || hojeBR(),
    p.cliente,
    p.produto,
    p.enderecoEntrega || "",
    p.qtd,
    p.precoUnit,
    total,
    entrada,
    restante,
    p.formaPgto || "Pendente",
    p.dataEntrega || "",
    p.status || "Aguardando confirmação",
    p.observacoes || "",
  ];
}

export async function createPedido(input: PedidoInput): Promise<{ id: string }> {
  const existing = await listPedidos();
  const id = nextId("PED", existing.map((p) => p.id));
  const seq = existing.length + 1;
  await appendRow(dataRange("Pedidos"), [pedidoRow(seq, id, input)]);
  return { id };
}

export async function updatePedido(
  rowNumber: number,
  input: Partial<Pedido>
): Promise<void> {
  const all = await listPedidos();
  const current = all.find((p) => p.rowNumber === rowNumber);
  if (!current) throw new Error("Pedido não encontrado");
  const m = { ...current, ...input };
  const total = m.qtd * m.precoUnit;
  const restante = total - (m.entradaPaga || 0);
  const row = [
    m.seq,
    m.id,
    m.idCliente,
    m.data,
    m.cliente,
    m.produto,
    m.enderecoEntrega,
    m.qtd,
    m.precoUnit,
    total,
    m.entradaPaga,
    restante,
    m.formaPgto,
    m.dataEntrega,
    m.status,
    m.observacoes,
  ];
  await updateRow(`${SHEETS.Pedidos.name}!A${rowNumber}:P${rowNumber}`, [row]);
}

// ===================== ENTRADAS =====================

export async function listEntradas(): Promise<Entrada[]> {
  const rows = await readSheet(dataRange("Entradas"));
  return rows
    .map((r, i) => ({ r, rowNumber: rowNum("Entradas", i) }))
    .filter(({ r }) => !isEmptyRow(r) && str(r[3]) !== "")
    .map(({ r, rowNumber }) => ({
      rowNumber,
      seq: str(r[0]),
      data: str(r[1]),
      idProduto: str(r[2]),
      produto: str(r[3]),
      qtd: parseNumber(r[4]),
      precoUnit: parseNumber(r[5]),
      total: parseNumber(r[6]),
      status: str(r[7]),
    }));
}

export async function createEntrada(input: {
  idProduto?: string;
  produto: string;
  qtd: number;
  precoUnit: number;
  status?: string;
}): Promise<void> {
  const existing = await listEntradas();
  const seq = existing.length + 1;
  const total = input.qtd * input.precoUnit;
  const row = [
    seq,
    hojeBR(),
    input.idProduto || "",
    input.produto,
    input.qtd,
    input.precoUnit,
    total,
    input.status || "Entregue",
  ];
  await appendRow(dataRange("Entradas"), [row]);
}

// ===================== CONSIGNADO =====================

export async function listConsignado(): Promise<Consignado[]> {
  const rows = await readSheet(dataRange("Consignado"));
  return rows
    .map((r, i) => ({ r, rowNumber: rowNum("Consignado", i) }))
    .filter(({ r }) => !isEmptyRow(r) && str(r[0]) !== "")
    .map(({ r, rowNumber }) => ({
      rowNumber,
      id: str(r[0]),
      idCliente: str(r[1]),
      cliente: str(r[2]),
      data: str(r[3]),
      produtosQtd: str(r[4]),
      valorConsignado: parseNumber(r[5]),
      valorDevolvido: parseNumber(r[6]),
      saldo: parseNumber(r[7]),
      status: str(r[8]),
      observacoes: str(r[9]),
    }));
}

export async function createConsignado(input: {
  idCliente: string;
  cliente: string;
  produtosQtd: string;
  valorConsignado: number;
  valorDevolvido?: number;
  status?: string;
  observacoes?: string;
  data?: string;
}): Promise<void> {
  const existing = await listConsignado();
  const id = nextId("CON", existing.map((c) => c.id));
  const devolvido = input.valorDevolvido || 0;
  const saldo = input.valorConsignado - devolvido;
  const row = [
    id,
    input.idCliente,
    input.cliente,
    input.data || hojeBR(),
    input.produtosQtd,
    input.valorConsignado,
    devolvido,
    saldo,
    input.status || "Ativo",
    input.observacoes || "",
  ];
  await appendRow(dataRange("Consignado"), [row]);
}

// ===================== RETIRADAS =====================

export async function listRetiradas(): Promise<Retirada[]> {
  const rows = await readSheet(dataRange("Retiradas"));
  return rows
    .map((r, i) => ({ r, rowNumber: rowNum("Retiradas", i) }))
    .filter(({ r }) => !isEmptyRow(r) && str(r[0]) !== "")
    .map(({ r, rowNumber }) => ({
      rowNumber,
      id: str(r[0]),
      data: str(r[1]),
      descricao: str(r[2]),
      valor: parseNumber(r[3]),
      formaPgto: str(r[4]),
      observacoes: str(r[5]),
    }));
}

export async function createRetirada(input: {
  descricao: string;
  valor: number;
  formaPgto?: string;
  observacoes?: string;
}): Promise<void> {
  const existing = await listRetiradas();
  const id = nextId("RET", existing.map((r) => r.id));
  const row = [
    id,
    hojeBR(),
    input.descricao,
    input.valor,
    input.formaPgto || "PIX",
    input.observacoes || "",
  ];
  await appendRow(dataRange("Retiradas"), [row]);
}

// ===================== ADICIONAIS =====================

function calcCustoPorPeca(custoEmbalagem: number, rendimento: number): number {
  if (!rendimento || rendimento <= 0) return 0;
  return Math.round((custoEmbalagem / rendimento) * 100) / 100;
}

export async function listAdicionais(): Promise<Adicional[]> {
  const rows = await readSheet(dataRange("Adicionais"));
  return rows
    .map((r, i) => ({ r, rowNumber: rowNum("Adicionais", i) }))
    .filter(({ r }) => !isEmptyRow(r) && str(r[0]) !== "")
    .map(({ r, rowNumber }) => ({
      rowNumber,
      id: str(r[0]),
      nome: str(r[1]),
      custoEmbalagem: parseNumber(r[2]),
      rendimento: parseNumber(r[3]),
      unidade: str(r[4]),
      custoPorPeca: parseNumber(r[5]),
      observacao: str(r[6]),
    }));
}

export interface AdicionalInput {
  nome: string;
  custoEmbalagem: number;
  rendimento: number;
  unidade?: string;
  observacao?: string;
}

function adicionalRow(id: string, p: AdicionalInput) {
  return [
    id,
    p.nome,
    p.custoEmbalagem,
    p.rendimento,
    p.unidade || "un",
    calcCustoPorPeca(p.custoEmbalagem, p.rendimento),
    p.observacao || "",
  ];
}

export async function createAdicional(input: AdicionalInput): Promise<void> {
  const existing = await listAdicionais();
  const id = nextId("ADD", existing.map((a) => a.id));
  await appendRow(dataRange("Adicionais"), [adicionalRow(id, input)]);
}

export async function updateAdicional(
  rowNumber: number,
  input: AdicionalInput & { id?: string }
): Promise<void> {
  const all = await listAdicionais();
  const current = all.find((a) => a.rowNumber === rowNumber);
  const id = input.id || current?.id || nextId("ADD", all.map((a) => a.id));
  await updateRow(`${SHEETS.Adicionais.name}!A${rowNumber}:G${rowNumber}`, [
    adicionalRow(id, input),
  ]);
}

export async function deleteAdicional(rowNumber: number): Promise<void> {
  await clearRange(`${SHEETS.Adicionais.name}!A${rowNumber}:G${rowNumber}`);
}

// ===================== CONFIG =====================

export async function getConfig(): Promise<Config> {
  try {
    const rows = await readSheet(`${SHEETS.Config.name}!A4:M4`);
    const row = rows[0];
    if (!row || isEmptyRow(row)) return DEFAULT_CONFIG;
    const cfg = { ...DEFAULT_CONFIG } as Record<string, number | string>;
    CONFIG_NUM_KEYS.forEach((key, i) => {
      const v = parseNumber(row[i]);
      if (v) cfg[key] = v;
    });
    CONFIG_STR_KEYS.forEach((key, i) => {
      const v = str(row[CONFIG_NUM_KEYS.length + i]);
      if (v) cfg[key] = v;
    });
    return cfg as unknown as Config;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(cfg: Config): Promise<void> {
  const row = [
    ...CONFIG_NUM_KEYS.map((k) => cfg[k]),
    ...CONFIG_STR_KEYS.map((k) => cfg[k] ?? ""),
  ];
  await updateRow(`${SHEETS.Config.name}!A4:M4`, [row]);
}

// ===================== DASHBOARD =====================

function mesAtualBR(): string {
  // retorna "MM/YYYY" no fuso de São Paulo
  const now = new Date().toLocaleDateString("pt-BR", {
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  return now; // "MM/YYYY"
}

export async function getDashboard(): Promise<DashboardData> {
  const [pedidos, consignado] = await Promise.all([
    listPedidos(),
    listConsignado(),
  ]);

  const mesAno = mesAtualBR();
  const faturamentoMes = pedidos
    .filter((p) => p.status !== "Cancelado" && p.data.endsWith(mesAno))
    .reduce((acc, p) => acc + p.total, 0);

  const statusMap = new Map<string, { quantidade: number; valor: number }>();
  for (const p of pedidos) {
    const cur = statusMap.get(p.status) || { quantidade: 0, valor: 0 };
    cur.quantidade += 1;
    cur.valor += p.total;
    statusMap.set(p.status, cur);
  }
  const statusResumo = Array.from(statusMap.entries())
    .map(([status, v]) => ({ status, ...v }))
    .sort((a, b) => b.valor - a.valor);

  const saldoConsignado = consignado.reduce((acc, c) => acc + c.saldo, 0);

  const ultimosPedidos = [...pedidos]
    .sort((a, b) => parseNumber(b.seq) - parseNumber(a.seq))
    .slice(0, 5);

  // Faturamento dos últimos 6 meses (para o gráfico de área).
  const agora = new Date();
  const faturamentoPorMes = Array.from({ length: 6 }, (_, idx) => {
    const i = 5 - idx;
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const mesAno = `${mm}/${d.getFullYear()}`;
    const faturado = pedidos
      .filter((p) => p.status !== "Cancelado" && p.data.endsWith(mesAno))
      .reduce((acc, p) => acc + p.total, 0);
    const mes = d
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "")
      .replace(/^\w/, (c) => c.toUpperCase());
    return { mes, faturado };
  });

  return {
    totalPedidos: pedidos.length,
    faturamentoMes,
    metaMensal: META_MENSAL,
    metaPercentual: META_MENSAL > 0 ? (faturamentoMes / META_MENSAL) * 100 : 0,
    saldoConsignado,
    statusResumo,
    ultimosPedidos,
    faturamentoPorMes,
  };
}
