// Controle de acesso: admins (por e-mail) + usuários liberados (publicMetadata).

export function getAdminEmails(): string[] {
  return (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

// Um usuário tem acesso se for admin OU se um admin liberou (publicMetadata.authorized).
export function isAuthorized(
  email: string | undefined | null,
  publicMetadata: Record<string, unknown> | undefined | null
): boolean {
  return isAdminEmail(email) || publicMetadata?.authorized === true;
}
