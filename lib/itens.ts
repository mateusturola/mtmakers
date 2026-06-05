// Serialização de listas de itens (produtos) para uma única célula da planilha.
// Formato: "2× Chaveiro @ R$ 5,00; 3× Medalha @ R$ 8,00"

import { formatBRL } from "@/lib/format";

export interface Item {
  produto: string;
  qtd: number;
  valorUnit: number;
}

export function parseValor(s: string): number {
  const cleaned = String(s)
    .replace(/r\$/i, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function serializeItens(itens: Item[]): string {
  return itens
    .filter((i) => i.produto && i.qtd > 0)
    .map((i) => `${i.qtd}× ${i.produto} @ ${formatBRL(i.valorUnit)}`)
    .join("; ");
}

export function parseItens(texto: string): Item[] {
  if (!texto) return [];
  return texto
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(\d+)\s*[×x]\s*(.+?)\s*@\s*(.+)$/i);
      if (m) {
        return { qtd: Number(m[1]) || 1, produto: m[2].trim(), valorUnit: parseValor(m[3]) };
      }
      return { qtd: 1, produto: s, valorUnit: 0 };
    });
}

export function totalItens(itens: Item[]): number {
  return Math.round(
    itens.reduce((acc, i) => acc + i.qtd * i.valorUnit, 0) * 100
  ) / 100;
}

export function qtdTotalItens(itens: Item[]): number {
  return itens.reduce((acc, i) => acc + (Number(i.qtd) || 0), 0);
}
