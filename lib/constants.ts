// ===== Constantes de domínio e design =====

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "Em produção": { bg: "#fff9c4", text: "#f57f17" },
  Entregue: { bg: "#c8e6c9", text: "#1b5e20" },
  "Aguardando confirmação": { bg: "#e3f2fd", text: "#0d47a1" },
  "Pronto para entrega": { bg: "#f3e5f5", text: "#4a148c" },
  "Aguardando pagamento": { bg: "#fff3e0", text: "#e65100" },
  Cancelado: { bg: "#ffcdd2", text: "#b71c1c" },
};

export const PEDIDO_STATUS = [
  "Em produção",
  "Aguardando confirmação",
  "Pronto para entrega",
  "Aguardando pagamento",
  "Entregue",
  "Cancelado",
] as const;

export const FORMAS_PGTO = [
  "PIX",
  "Dinheiro",
  "Cartão",
  "Boleto",
  "Pendente",
  "Parcialmente pago",
] as const;

export const CLIENTE_TIPOS = [
  "Evento",
  "Consignado",
  "Varejo",
  "Atacado",
  "Outro",
] as const;

export const PRODUTO_CATEGORIAS = [
  "Medalhas",
  "COPA",
  "CASA",
  "EMBALAGEM",
  "AMOR",
  "Brinquedos",
  "Personalizado",
  "Chaveiros",
  "Times de futebol",
] as const;

export const CONSIGNADO_STATUS = [
  "Ativo",
  "Parcialmente devolvido",
  "Finalizado",
  "Cancelado",
] as const;

// Meta mensal de faturamento (R$). Ajustável conforme o negócio.
export const META_MENSAL = 10000;

export function statusStyle(status: string): { bg: string; text: string } {
  return STATUS_COLORS[status] || { bg: "#eef1fb", text: "#3949ab" };
}
