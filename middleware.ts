import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rotas públicas (não exigem login).
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Ignora arquivos estáticos e _next, mas roda em todo o resto.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Sempre roda nas rotas de API.
    "/(api|trpc)(.*)",
  ],
};
