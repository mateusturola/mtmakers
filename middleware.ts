import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Rotas públicas (não exigem login).
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/nao-autorizado",
]);

// Lista de e-mails autorizados (funcionários). Definida em ALLOWED_EMAILS
// (separados por vírgula). Se vazia, o controle de allowlist fica desligado.
const ALLOWED = (process.env.ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  // Controle de acesso por e-mail (allowlist de funcionários).
  if (ALLOWED.length > 0) {
    let email: string | undefined;
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      email = user.emailAddresses
        .find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress?.toLowerCase();
    } catch {
      email = undefined;
    }

    if (!email || !ALLOWED.includes(email)) {
      // API → 403; página → tela de "não autorizado".
      if (req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.json(
          { error: "Acesso não autorizado para esta conta." },
          { status: 403 }
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/nao-autorizado";
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
