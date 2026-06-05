"use client";

import { useCallback, useEffect, useState } from "react";
import type { Adicional } from "@/types";

export function custoPorPeca(custoEmbalagem: number, rendimento: number): number {
  if (!rendimento || rendimento <= 0) return 0;
  return Math.round((custoEmbalagem / rendimento) * 100) / 100;
}

export interface AdicionalInput {
  nome: string;
  custoEmbalagem: number;
  rendimento: number;
  unidade: string;
  observacao?: string;
}

export function useAdicionais() {
  const [data, setData] = useState<Adicional[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/adicionais", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setData(json.data || []);
    } catch {
      // silencioso
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const send = useCallback(
    async (method: string, body?: unknown, query = "") => {
      const res = await fetch(`/api/adicionais${query}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erro");
      }
      await refetch();
    },
    [refetch]
  );

  const add = useCallback((input: AdicionalInput) => send("POST", input), [send]);
  const update = useCallback(
    (rowNumber: number, input: AdicionalInput) => send("PUT", { rowNumber, ...input }),
    [send]
  );
  const remove = useCallback(
    (rowNumber: number) => send("DELETE", undefined, `?rowNumber=${rowNumber}`),
    [send]
  );

  return { data, loaded, add, update, remove, refetch };
}
