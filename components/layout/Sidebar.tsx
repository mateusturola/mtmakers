"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignedIn } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  ArrowDownToLine,
  Handshake,
  Wallet,
  Calculator,
  Package2,
  Settings,
  FileText,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/adicionais", label: "Adicionais", icon: Package2 },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/entradas", label: "Entradas", icon: ArrowDownToLine },
  { href: "/consignado", label: "Consignado", icon: Handshake },
  { href: "/retiradas", label: "Retiradas", icon: Wallet },
  { href: "/calculadora", label: "Calculadora", icon: Calculator, highlight: true },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-sidebar p-2 text-sidebar-foreground shadow-lg"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 z-50 h-screen w-64 shrink-0 flex flex-col",
          "bg-sidebar text-sidebar-foreground transition-transform",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-5 h-[68px] border-b border-sidebar-border">
          <Link href="/dashboard">
            <Logo chip width={140} />
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-sidebar-foreground"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-white"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
                  item.highlight && !active && "ring-1 ring-sidebar-primary/50"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
                {item.highlight && (
                  <span className="ml-auto text-[10px] font-semibold rounded bg-sidebar-primary px-1.5 py-0.5 text-white">
                    R$
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <SignedIn>
            <div className="flex items-center gap-3 rounded-lg px-1 py-1">
              <UserButton afterSignOutUrl="/sign-in" />
              <span className="text-xs text-sidebar-foreground/70">
                Minha conta
              </span>
            </div>
          </SignedIn>
          <p className="px-1 mt-3 text-xs text-sidebar-foreground/50">
            Impressão 3D personalizada
          </p>
        </div>
      </aside>
    </>
  );
}
