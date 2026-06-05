// ===== Precificação MT Makers (lógica da skill 3d-pricing) =====
// Cálculo 100% local e determinístico — não usa API.

export const PRICING_DEFAULTS = {
  filamentoKg: 125, // R$/kg
  energiaKwh: 1.53, // R$/kWh
  potenciaKw: 0.12, // 120 W
  depreciacaoHora: 1.25, // R$/h (R$2.500 / 2.000h)
  valorHora: 30, // R$/h mão de obra
  manuseioMin: 5, // min por rodada
  margemPadrao: 50, // %
} as const;

export interface PricingInput {
  nome: string;
  categoria: string;
  pesoGramas: number; // por peça
  tempoImpressaoMin: number; // por peça
  qtdPorPlaca: number; // peças por placa (>=1)
  custoFilamentoPorKg?: number; // override do padrão 125
  tarifaEnergiaKwh?: number; // override do padrão 1,53
  materiaisExtras?: number; // R$ por peça (fita, argola, etc.)
  qtdPedido?: number; // para totais e aviso de filamento
}

export interface MarkupLinha {
  markup: number; // %
  fator: number;
  precoUnit: number;
  comDesconto10: number;
  comNota6: number;
  destaque: boolean;
}

export interface PricingResult {
  // breakdown por peça
  custoFilamento: number;
  custoEnergia: number;
  custoDepreciacao: number;
  custoMaoObra: number;
  custoExtras: number;
  custoTotal: number;
  // resultado
  precoSugerido: number; // markup 50% (padrão)
  lucroPorPeca: number;
  margemReal: number; // %
  markups: MarkupLinha[];
  // lote
  rodadas: number;
  horasTotais: number;
  pesoTotalG: number;
  rolosFilamento: number;
  // texto
  explicacao: string;
  recomendacao: string;
  // pronto para salvar como Produto
  produto: {
    custoPc: number;
    preco50: number;
    preco60: number;
    preco70: number;
    preco80: number;
    comDesc10: number;
    comNota6: number;
    margem: number;
  };
}

const round2 = (x: number) => Math.round(x * 100) / 100;
// Arredonda para CIMA no R$ 0,50 mais próximo (regra da skill).
const roundUp050 = (x: number) => Math.ceil(x * 2) / 2;

const FATORES: { markup: number; fator: number }[] = [
  { markup: 50, fator: 1.5 },
  { markup: 60, fator: 1.6 },
  { markup: 70, fator: 1.7 },
  { markup: 80, fator: 1.8 },
  { markup: 100, fator: 2.0 },
  { markup: 120, fator: 2.2 },
  { markup: 150, fator: 2.5 },
];

// Custos padrão configuráveis pelo usuário (tela de Configurações).
export interface PricingConfig {
  filamentoKg?: number;
  energiaKwh?: number;
  potenciaW?: number;
  custoImpressora?: number;
  vidaUtilHoras?: number;
  valorHora?: number;
  manuseioMin?: number;
  margemPadrao?: number;
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function calcularPreco(input: PricingInput, cfg: PricingConfig = {}): PricingResult {
  // Resolve custos: override por cálculo > config do usuário > padrão MT Makers.
  const filamentoKg =
    input.custoFilamentoPorKg || cfg.filamentoKg || PRICING_DEFAULTS.filamentoKg;
  const energiaKwh =
    input.tarifaEnergiaKwh || cfg.energiaKwh || PRICING_DEFAULTS.energiaKwh;
  const potenciaKw = (cfg.potenciaW ?? 120) / 1000;
  const deprecHora =
    cfg.custoImpressora && cfg.vidaUtilHoras
      ? cfg.custoImpressora / cfg.vidaUtilHoras
      : PRICING_DEFAULTS.depreciacaoHora;
  const valorHora = cfg.valorHora ?? PRICING_DEFAULTS.valorHora;
  const manuseioMin = cfg.manuseioMin ?? PRICING_DEFAULTS.manuseioMin;
  const margemPadrao = cfg.margemPadrao ?? PRICING_DEFAULTS.margemPadrao;

  const pcsPlaca = Math.max(1, input.qtdPorPlaca || 1);
  const qtdPedido = Math.max(1, input.qtdPedido || 1);
  const extras = input.materiaisExtras || 0;

  const horas = input.tempoImpressaoMin / 60;

  // Peso e tempo são da PLACA inteira (slicer); dividimos por peças/placa
  // para obter o custo por peça. A mão de obra (manuseio da rodada) também
  // é rateada entre as peças da placa.
  const custoFilamento = ((input.pesoGramas / 1000) * filamentoKg) / pcsPlaca;
  const custoEnergia = (potenciaKw * horas * energiaKwh) / pcsPlaca;
  const custoDepreciacao = (deprecHora * horas) / pcsPlaca;
  const custoMaoObra = (valorHora / 60) * (manuseioMin / pcsPlaca);
  const custoExtras = extras;

  const custoTotal =
    custoFilamento + custoEnergia + custoDepreciacao + custoMaoObra + custoExtras;

  const markups: MarkupLinha[] = FATORES.map((f) => {
    const precoUnit = roundUp050(custoTotal * f.fator);
    return {
      markup: f.markup,
      fator: f.fator,
      precoUnit,
      comDesconto10: round2(precoUnit * 0.9),
      comNota6: round2(precoUnit * 1.06),
      destaque: f.markup === margemPadrao,
    };
  });

  const padrao = markups.find((m) => m.destaque) || markups[0];
  const precoSugerido = padrao.precoUnit;
  const lucroPorPeca = round2(precoSugerido - custoTotal);
  const margemReal = round2((lucroPorPeca / precoSugerido) * 100);

  // Lote (peso/tempo por peça = total da placa ÷ peças por placa)
  const rodadas = Math.ceil(qtdPedido / pcsPlaca);
  const horasTotais = round2(((input.tempoImpressaoMin / pcsPlaca) * qtdPedido) / 60);
  const pesoTotalG = round2((input.pesoGramas / pcsPlaca) * qtdPedido);
  const rolosFilamento = Math.ceil(pesoTotalG / 1000);

  const explicacao =
    `Custo por peça: ${formatBRL(custoTotal)} — filamento ${formatBRL(custoFilamento)}, ` +
    `energia ${formatBRL(custoEnergia)}, depreciação ${formatBRL(custoDepreciacao)}, ` +
    `mão de obra ${formatBRL(custoMaoObra)}` +
    (custoExtras > 0 ? `, extras ${formatBRL(custoExtras)}` : "") +
    `. Valores padrão MT Makers: filamento ${formatBRL(filamentoKg)}/kg, ` +
    `energia ${formatBRL(energiaKwh)}/kWh, impressora 120W.`;

  let recomendacao =
    `Preço sugerido (markup 50%, padrão MT Makers): ${formatBRL(precoSugerido)} — ` +
    `lucro de ${formatBRL(lucroPorPeca)}/peça (margem real ${margemReal}%). ` +
    `Desconto máximo sem perder margem: ${formatBRL(padrao.comDesconto10)}. ` +
    `Com nota fiscal: ${formatBRL(padrao.comNota6)}.`;

  if (pesoTotalG > 1000) {
    recomendacao += ` ⚠️ O pedido de ${qtdPedido} peça(s) usa ${pesoTotalG}g — ` +
      `você vai precisar de ${rolosFilamento} rolo(s) de filamento.`;
  }

  return {
    custoFilamento: round2(custoFilamento),
    custoEnergia: round2(custoEnergia),
    custoDepreciacao: round2(custoDepreciacao),
    custoMaoObra: round2(custoMaoObra),
    custoExtras: round2(custoExtras),
    custoTotal: round2(custoTotal),
    precoSugerido,
    lucroPorPeca,
    margemReal,
    markups,
    rodadas,
    horasTotais,
    pesoTotalG,
    rolosFilamento,
    explicacao,
    recomendacao,
    produto: {
      custoPc: round2(custoTotal),
      preco50: markups[0].precoUnit,
      preco60: markups[1].precoUnit,
      preco70: markups[2].precoUnit,
      preco80: markups[3].precoUnit,
      comDesc10: padrao.comDesconto10,
      comNota6: padrao.comNota6,
      margem: margemPadrao,
    },
  };
}
