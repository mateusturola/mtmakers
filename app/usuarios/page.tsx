"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/shared/States";
import { toast } from "sonner";
import { ShieldCheck, ShieldX, ShieldAlert, Crown } from "lucide-react";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  imageUrl?: string;
  isAdmin: boolean;
  authorized: boolean;
}

export default function UsuariosPage() {
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/usuarios", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro");
      setData(json.data || []);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alterar(u: Usuario, authorized: boolean) {
    setSalvando(u.id);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, authorized }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(authorized ? "Acesso liberado" : "Acesso revogado");
      carregar();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSalvando(null);
    }
  }

  return (
    <>
      <Header
        title="Usuários e acessos"
        subtitle="Libere quem pode usar o sistema"
      />
      <PageContainer>
        <Card className="p-4 shadow-sm">
          {loading ? (
            <TableSkeleton cols={3} />
          ) : erro ? (
            <div className="grid place-items-center py-12 text-center">
              <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
              <p className="font-medium text-destructive">{erro}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Esta área é só para administradores.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-3">
                  {u.imageUrl ? (
                    <Image
                      src={u.imageUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{u.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  {u.isAdmin ? (
                    <Badge variant="secondary" className="gap-1">
                      <Crown className="h-3 w-3" /> Admin
                    </Badge>
                  ) : u.authorized ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1b7a3d]">
                      <ShieldCheck className="h-4 w-4" /> Autorizado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#b26a00]">
                      <ShieldAlert className="h-4 w-4" /> Pendente
                    </span>
                  )}
                  {!u.isAdmin &&
                    (u.authorized ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={salvando === u.id}
                        onClick={() => alterar(u, false)}
                      >
                        <ShieldX className="h-3.5 w-3.5" /> Revogar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={salvando === u.id}
                        onClick={() => alterar(u, true)}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Liberar
                      </Button>
                    ))}
                </li>
              ))}
              {data.length === 0 && (
                <li className="py-8 text-center text-muted-foreground">
                  Nenhum usuário ainda.
                </li>
              )}
            </ul>
          )}
        </Card>
        <p className="text-xs text-muted-foreground mt-3">
          Novos logins entram como <strong>Pendente</strong> e não veem nada até serem
          liberados aqui. Administradores são definidos pela variável <code>ALLOWED_EMAILS</code>.
        </p>
      </PageContainer>
    </>
  );
}
