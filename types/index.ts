// ===== MT Makers — Tipos do sistema =====

export type ClienteTipo = "Evento" | "Consignado" | "Varejo" | "Atacado" | "Outro";

export interface Cliente {
  rowNumber: number; // linha real na planilha (para update/delete)
  seq: string; // coluna A (#)
  id: string; // CLI-001
  nome: string;
  whatsapp: string;
  tipo: ClienteTipo | string;
  cidade: string;
  cadastradoEm: string;
  observacoes: string;
}

export type ProdutoCategoria =
  | "Medalhas"
  | "COPA"
  | "CASA"
  | "EMBALAGEM"
  | "AMOR"
  | "Brinquedos"
  | "Personalizado"
  | "Chaveiros"
  | "Times de futebol";

export interface Produto {
  rowNumber: number;
  seq: string;
  id: string; // MTK-001
  data: string;
  peca: string;
  categoria: ProdutoCategoria | string;
  pesoG: number;
  tempoMin: number;
  qtd: number;
  pcsPlaca: number;
  custoPc: number;
  preco50: number;
  preco60: number;
  preco70: number;
  preco80: number;
  comDesc10: number;
  comNota6: number;
  margem: number;
  totalVenda: number;
}

export type PedidoStatus =
  | "Em produção"
  | "Aguardando confirmação"
  | "Pronto para entrega"
  | "Aguardando pagamento"
  | "Entregue"
  | "Cancelado";

export type FormaPgto =
  | "PIX"
  | "Dinheiro"
  | "Cartão"
  | "Boleto"
  | "Pendente"
  | "Parcialmente pago";

export interface Pedido {
  rowNumber: number;
  seq: string;
  id: string; // PED-001
  idCliente: string;
  data: string;
  cliente: string;
  produto: string;
  enderecoEntrega: string;
  qtd: number;
  precoUnit: number;
  total: number;
  entradaPaga: number;
  restante: number;
  formaPgto: FormaPgto | string;
  dataEntrega: string;
  status: PedidoStatus | string;
  observacoes: string;
}

export interface Orcamento {
  rowNumber: number;
  seq: string;
  id: string; // ORC-001
  idCliente: string;
  data: string;
  cliente: string;
  produtos: string; // lista serializada
  enderecoEntrega: string;
  qtd: number; // qtd total
  total: number;
  entradaPaga: number;
  restante: number;
  formaPgto: string;
  validade: string; // data de validade
  status: string;
  observacoes: string;
}

export interface Consignado {
  rowNumber: number;
  id: string;
  idCliente: string;
  cliente: string;
  data: string;
  produtosQtd: string;
  valorConsignado: number;
  valorDevolvido: number;
  saldo: number;
  status: string;
  observacoes: string;
}

export interface Retirada {
  rowNumber: number;
  id: string;
  data: string;
  descricao: string;
  valor: number;
  formaPgto: string;
  observacoes: string;
}

export interface Entrada {
  rowNumber: number;
  seq: string;
  data: string;
  idProduto: string;
  produto: string;
  qtd: number;
  precoUnit: number;
  total: number;
  status: string;
}

export interface DashboardData {
  totalPedidos: number;
  faturamentoMes: number;
  metaMensal: number;
  metaPercentual: number;
  saldoConsignado: number;
  statusResumo: { status: string; quantidade: number; valor: number }[];
  ultimosPedidos: Pedido[];
  faturamentoPorMes: { mes: string; faturado: number }[];
  produtosCampeoes: { produto: string; qtd: number; faturamento: number; lucro: number }[];
}

export interface Adicional {
  rowNumber: number;
  id: string;
  nome: string;
  custoEmbalagem: number; // R$ pago pela embalagem/rolo/pacote
  rendimento: number; // quantas peças/usos a embalagem rende
  unidade: string; // descritivo: "un", "peças", "cm", "m"...
  custoPorPeca: number; // = custoEmbalagem / rendimento
  observacao?: string;
}

export interface CalculoPrecoIA {
  custoFilamento: number;
  custoEnergia: number;
  custoOperacional: number;
  custoTotal: number;
  precos: {
    margem30: number;
    margem50: number;
    margem70: number;
    margem100: number;
    comNota: number;
    comDesconto10: number;
  };
  explicacao: string;
  recomendacao: string;
}
