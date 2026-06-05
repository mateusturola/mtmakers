// Papéis (cargos) e o que cada um pode acessar (por módulo = primeiro segmento da rota).

export type Role = "admin" | "vendedor" | "producao";

export const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "admin", label: "Administrador", desc: "Acesso total + gerencia usuários" },
  { value: "vendedor", label: "Vendedor", desc: "Clientes, orçamentos, pedidos, produtos" },
  { value: "producao", label: "Produção", desc: "Pedidos, produtos, entradas, calculadora" },
];

export const ROLE_PERMS: Record<Role, string[] | "*"> = {
  admin: "*",
  vendedor: ["dashboard", "clientes", "produtos", "orcamentos", "pedidos", "calculadora"],
  producao: ["dashboard", "pedidos", "produtos", "entradas", "calculadora"],
};

export function can(role: string | null | undefined, modulo: string): boolean {
  if (!role) return false;
  const perms = ROLE_PERMS[role as Role];
  if (!perms) return false;
  return perms === "*" || perms.includes(modulo);
}

export function roleLabel(role: string | null | undefined): string {
  return ROLES.find((r) => r.value === role)?.label ?? "Sem acesso";
}
