"use client";

import { useCallback, useEffect, useState } from "react";

interface State<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

// Hook genérico para listar uma coleção a partir de um endpoint /api/*.
export function useCollection<T>(endpoint: string) {
  const [state, setState] = useState<State<T>>({
    data: [],
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar dados");
      setState({ data: json.data || [], loading: false, error: null });
    } catch (e) {
      setState({ data: [], loading: false, error: (e as Error).message });
    }
  }, [endpoint]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
