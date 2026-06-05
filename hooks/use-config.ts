"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CONFIG, depreciacaoHora, type Config } from "@/lib/config";

export { DEFAULT_CONFIG, depreciacaoHora };
export type { Config };

export function useConfig() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/config", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.data) setConfig({ ...DEFAULT_CONFIG, ...json.data });
    } catch {
      // mantém o padrão em caso de erro
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = useCallback(async (c: Config) => {
    setConfig(c); // otimista
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || "Erro ao salvar configurações");
    }
  }, []);

  const reset = useCallback(() => save(DEFAULT_CONFIG), [save]);

  return { config, loaded, save, reset, refetch };
}
