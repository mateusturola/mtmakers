import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Rotas públicas (não exigem login).
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/nao-autorizado",
]);

// Admins (sempre liberados e gerenciam os demais). Demais usuários só entram
// se um admin liberar (publicMetadata.authorized = true no Clerk).
const ADMINS = (process.env.ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  let autorizado = false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses
      .find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress?.toLowerCase();
    const isAdmin = !!email && ADMINS.includes(email);
    autorizado = isAdmin || user.publicMetadata?.authorized === true;
  } catch {
    autorizado = false;
  }

  if (!autorizado) {
    if (req.nextUrl.pathname.startsWith("/api")) {
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
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
