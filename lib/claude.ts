import Anthropic from "@anthropic-ai/sdk";
import type { CalculoPrecoIA } from "@/types";

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface DadosProduto {
  nome: string;
  categoria: string;
  pesoGramas: number;
  tempoImpressaoMin: number;
  qtdPorPlaca: number;
  materialFilamento?: string;
  custoFilamentoPorKg?: number;
  custoEletricidadeKwh?: number;
  margemDesejada?: number;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function calcularPrecoIA(
  dados: DadosProduto
): Promise<CalculoPrecoIA> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Claude não configurado: defina ANTHROPIC_API_KEY no .env.local"
    );
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `Você é um especialista em precificação de impressão 3D para a empresa MT Makers.
Sua função é calcular preços de venda baseado nos custos reais de produção.

Considere sempre:
- Custo de filamento: peso da peça × (custo/kg ÷ 1000)
- Custo de energia: tempo de impressão (em horas) × consumo da impressora (média 0,15 kWh) × tarifa de energia
- Custo operacional: 30% sobre o custo total (mão de obra, desgaste, manutenção, etc)
- Margem de lucro desejada sobre o custo total
- Preços de mercado para impressão 3D no Brasil

Retorne SEMPRE um JSON estruturado com os cálculos detalhados e múltiplas opções de preço.
Todos os valores monetários devem ser números puros em reais (ex: 12.5), sem o símbolo R$.`;

  const userPrompt = `Calcule o preço para esta peça:
Nome: ${dados.nome}
Categoria: ${dados.categoria}
Peso: ${dados.pesoGramas}g
Tempo de impressão: ${dados.tempoImpressaoMin} minutos
Quantidade por placa: ${dados.qtdPorPlaca} peças
${dados.materialFilamento ? `Material: ${dados.materialFilamento}` : "Material: PLA padrão"}
${
    dados.custoFilamentoPorKg
      ? `Custo filamento/kg: R$ ${dados.custoFilamentoPorKg}`
      : "Custo filamento/kg: R$ 80,00 (PLA padrão)"
  }
${
    dados.custoEletricidadeKwh
      ? `Tarifa energia: R$ ${dados.custoEletricidadeKwh}/kWh`
      : "Tarifa energia: R$ 0,75/kWh"
  }
${dados.margemDesejada ? `Margem desejada: ${dados.margemDesejada}%` : ""}

Retorne APENAS um JSON (sem texto antes ou depois) com:
{
  "custoFilamento": number,
  "custoEnergia": number,
  "custoOperacional": number,
  "custoTotal": number,
  "precos": {
    "margem30": number,
    "margem50": number,
    "margem70": number,
    "margem100": number,
    "comNota": number,
    "comDesconto10": number
  },
  "explicacao": string,
  "recomendacao": string
}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = message.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Resposta inválida do Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("JSON não encontrado na resposta do Claude");

  return JSON.parse(jsonMatch[0]) as CalculoPrecoIA;
}
