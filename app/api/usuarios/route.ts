import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/lib/access";

export const dynamic = "force-dynamic";

function emailDe(u: {
  emailAddresses: { id: string; emailAddress: string }[];
  primaryEmailAddressId: string | null;
}): string {
  return (
    u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress || ""
  );
}

// Garante que quem chama é admin. Retorna o client do Clerk.
async function exigirAdmin() {
  const { userId } = await auth();
  if (!userId) return { erro: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  if (!isAdminEmail(emailDe(me))) {
    return { erro: NextResponse.json({ error: "Apenas administradores" }, { status: 403 }) };
  }
  return { client };
}

export async function GET() {
  try {
    const { erro, client } = await exigirAdmin();
    if (erro) return erro;

    const list = await client.users.getUserList({ limit: 100, orderBy: "-created_at" });
    const data = list.data.map((u) => {
      const email = emailDe(u);
      const isAdmin = isAdminEmail(email);
      const role = isAdmin
        ? "admin"
        : (typeof u.publicMetadata?.role === "string" && u.publicMetadata.role) || null;
      return {
        id: u.id,
        email,
        nome: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "—",
        imageUrl: u.imageUrl,
        isAdmin,
        role,
      };
    });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { erro, client } = await exigirAdmin();
    if (erro) return erro;

    const body = await req.json();
    if (!body.userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }
    // role vazio/null = remover acesso; senão define o papel.
    const role = body.role || null;
    await client.users.updateUserMetadata(body.userId, {
      publicMetadata: { role, authorized: role ? true : false },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
