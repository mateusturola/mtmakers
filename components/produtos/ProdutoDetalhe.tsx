"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultadoCalculo } from "@/components/calculadora/ResultadoCalculo";
import type { PricingResult } from "@/lib/pricing";
import type { Produto } from "@/types";
import { Pencil, Loader2 } from "lucide-react";

interface Props {
  produto: Produto | null;
  onClose: () => void;
  onEdit: (p: Produto) => void;
}

export function ProdutoDetalhe({ produto, onClose, onEdit }: Props) {
  const [result, setResult] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!produto) return;
    setLoading(true);
    setResult(null);
    setErro(null);
    fetch("/api/calculadora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: produto.peca,
        categoria: produto.categoria,
        pesoGramas: produto.pesoG,
        tempoImpressaoMin: produto.tempoMin,
        qtdPorPlaca: produto.pcsPlaca || produto.qtd || 1,
      }),
    })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Erro");
        setResult(j.data);
      })
      .catch((e) => setErro((e as Error).message))
      .finally(() => setLoading(false));
  }, [produto]);

  return (
    <Dialog open={!!produto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {produto?.peca}
            <span className="font-mono text-xs font-normal text-muted-foreground">
              {produto?.id}
            </span>
            {produto?.categoria && (
              <Badge variant="secondary">{produto.categoria}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
          </div>
        ) : erro ? (
          <p className="text-sm text-destructive py-6 text-center">{erro}</p>
        ) : result ? (
          <ResultadoCalculo r={result} />
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            onClick={() => {
              if (produto) {
                const p = produto;
                onClose();
                onEdit(p);
              }
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
