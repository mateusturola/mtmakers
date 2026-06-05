"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

// Esconde a navegação nas telas de autenticação.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/nao-autorizado");

  if (isAuthRoute) {
    return <div className="min-h-screen grid place-items-center p-4">{children}</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 lg:pl-0">{children}</main>
    </div>
  );
}
