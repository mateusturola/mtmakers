// ===== Configuração das abas da planilha MT Makers =====
// Dados começam na linha 4 (linha 1 = banner, linha 3 = headers).

export const SHEETS = {
  Clientes: { name: "Clientes", gid: 1161279121, firstDataRow: 4, lastCol: "H" },
  Produtos: { name: "Produtos", gid: 1310523105, firstDataRow: 4, lastCol: "T" },
  Pedidos: { name: "Pedidos", gid: 1035898222, firstDataRow: 4, lastCol: "P" },
  Orcamentos: { name: "Orcamentos", gid: 0, firstDataRow: 4, lastCol: "O" },
  Consignado: { name: "Consignado", gid: 904497732, firstDataRow: 4, lastCol: "J" },
  Retiradas: { name: "Retiradas", gid: 152567176, firstDataRow: 4, lastCol: "F" },
  Entradas: { name: "Entradas", gid: 2018329118, firstDataRow: 4, lastCol: "H" },
  Adicionais: { name: "Adicionais", gid: 0, firstDataRow: 4, lastCol: "G" },
  Config: { name: "Config", gid: 0, firstDataRow: 4, lastCol: "M" },
} as const;

export type SheetKey = keyof typeof SHEETS;

// Range completo de dados de uma aba (a partir da primeira linha de dados).
export function dataRange(key: SheetKey): string {
  const s = SHEETS[key];
  return `${s.name}!A${s.firstDataRow}:${s.lastCol}`;
}
