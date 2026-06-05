import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { effectiveRole } from "@/lib/access";
import { can } from "@/lib/roles";

// Rotas públicas (não exigem login).
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/nao-autorizado",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  let role: string | null = null;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses
      .find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress?.toLowerCase();
    role = effectiveRole(email, user.publicMetadata as Record<string, unknown>);
  } catch {
    role = null;
  }

  const path = req.nextUrl.pathname;
  const isApi = path.startsWith("/api");

  // Sem papel = sem acesso (pendente de liberação).
  if (!role) {
    if (isApi) {
      return NextResponse.json(
        { error: "Acesso não autorizado. Peça liberação ao administrador." },
        { status: 403 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/nao-autorizado";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Gestão de usuários é só de admin (reforço além da checagem na própria rota).
  if (path.startsWith("/usuarios") || path.startsWith("/api/usuarios")) {
    if (role !== "admin") {
      if (isApi)
        return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return;
  }

  // Páginas: checa o módulo (primeiro segmento) contra as permissões do papel.
  if (!isApi) {
    const modulo = path.split("/")[1] || "dashboard";
    if (modulo && !can(role, modulo)) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
