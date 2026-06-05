// Configuração de custos padrão — compartilhada entre server e client.

export interface Config {
  filamentoKg: number; // R$/kg
  energiaKwh: number; // R$/kWh
  potenciaW: number; // Watts
  custoImpressora: number; // R$
  vidaUtilHoras: number; // h
  valorHora: number; // R$/h
  manuseioMin: number; // min por rodada
  margemPadrao: number; // % (markup padrão)
  metaMensal: number; // R$ (meta do dashboard)
  // Pagamento / pedido
  chavePix: string;
  recebedorNome: string;
  recebedorCidade: string;
  obsPedido: string; // observações padrão no PDF do pedido
}

const OBS_PADRAO =
  "Prazo de entrega a combinar após a confirmação e o pagamento da entrada.\n" +
  "Produtos personalizados só entram em produção após a aprovação da arte/prova pelo cliente.\n" +
  "Não nos responsabilizamos por erros (texto, cor, medida) em artes aprovadas pelo cliente.\n" +
  "Pagamento via PIX usando a chave/QR Code abaixo.";

export const DEFAULT_CONFIG: Config = {
  filamentoKg: 125,
  energiaKwh: 1.53,
  potenciaW: 120,
  custoImpressora: 2500,
  vidaUtilHoras: 2000,
  valorHora: 30,
  manuseioMin: 5,
  margemPadrao: 50,
  metaMensal: 10000,
  chavePix: "",
  recebedorNome: "MT Makers",
  recebedorCidade: "SAO PAULO",
  obsPedido: OBS_PADRAO,
};

// Colunas numéricas (A–I) e de texto (J–M) na aba "Config" (linha 4 = valores).
// Manter em sincronia com CONFIG_HEADERS e scripts/setup-sheets.mjs.
export const CONFIG_NUM_KEYS: (keyof Config)[] = [
  "filamentoKg",
  "energiaKwh",
  "potenciaW",
  "custoImpressora",
  "vidaUtilHoras",
  "valorHora",
  "manuseioMin",
  "margemPadrao",
  "metaMensal",
];

export const CONFIG_STR_KEYS: (keyof Config)[] = [
  "chavePix",
  "recebedorNome",
  "recebedorCidade",
  "obsPedido",
];

export const CONFIG_HEADERS = [
  "Filamento (R$/kg)",
  "Energia (R$/kWh)",
  "Potência (W)",
  "Custo impressora (R$)",
  "Vida útil (h)",
  "Valor hora (R$/h)",
  "Manuseio (min)",
  "Markup padrão (%)",
  "Meta mensal (R$)",
  "Chave PIX",
  "Recebedor (nome)",
  "Recebedor (cidade)",
  "Observações do pedido",
];

export function depreciacaoHora(c: Config): number {
  if (!c.vidaUtilHoras) return 0;
  return Math.round((c.custoImpressora / c.vidaUtilHoras) * 100) / 100;
}
