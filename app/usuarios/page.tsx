"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/shared/States";
import { toast } from "sonner";
import { ROLES } from "@/lib/roles";
import { ShieldAlert, Crown } from "lucide-react";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  imageUrl?: string;
  isAdmin: boolean;
  role: string | null;
}

const SEM_ACESSO = "__sem__";

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

  async function definirRole(u: Usuario, novo: string) {
    const role = novo === SEM_ACESSO ? "" : novo;
    setSalvando(u.id);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(role ? "Papel atualizado" : "Acesso removido");
      carregar();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSalvando(null);
    }
  }

  return (
    <>
      <Header title="Usuários e acessos" subtitle="Defina o papel de cada pessoa" />
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
                  ) : (
                    <Select
                      value={u.role || SEM_ACESSO}
                      onValueChange={(v) => definirRole(u, v ?? SEM_ACESSO)}
                      disabled={salvando === u.id}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SEM_ACESSO}>Sem acesso</SelectItem>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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

        <Card className="p-4 shadow-sm mt-4">
          <h2 className="font-semibold text-foreground mb-2 text-sm">O que cada papel acessa</h2>
          <ul className="text-xs text-muted-foreground space-y-1">
            {ROLES.map((r) => (
              <li key={r.value}>
                <strong className="text-foreground">{r.label}:</strong> {r.desc}
              </li>
            ))}
            <li>
              <strong className="text-foreground">Sem acesso:</strong> não consegue entrar (pendente).
            </li>
          </ul>
        </Card>
      </PageContainer>
    </>
  );
}
