import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MT Makers — Gestão",
  description: "Sistema de gestão empresarial MT Makers — impressão 3D personalizada",
};

// Todas as rotas exigem autenticação (Clerk) — renderiza sob demanda em vez
// de pré-renderizar no build (evita "Missing publishableKey" sem chaves).
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      localization={ptBR}
      appearance={{ variables: { colorPrimary: "#3D5AFE" } }}
    >
      <html lang="pt-BR" className={inter.variable}>
        <body
          className={cn(
            inter.className,
            "font-sans antialiased bg-background text-foreground min-h-screen"
          )}
        >
          <AppShell>{children}</AppShell>
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
