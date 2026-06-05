// Formatação pt-BR para exibição na UI.

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 0)}%`;
}

// Garante DD/MM/YYYY; aceita já formatado ou ISO.
export function formatDateBR(value: string): string {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}
