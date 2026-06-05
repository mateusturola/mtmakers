import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/lib/format";
import type { PricingResult } from "@/lib/pricing";
import { Layers, TrendingUp, Info } from "lucide-react";

export function ResultadoCalculo({ r }: { r: PricingResult }) {
  const custos = [
    { label: "Filamento", value: r.custoFilamento },
    { label: "Energia", value: r.custoEnergia },
    { label: "Depreciação", value: r.custoDepreciacao },
    { label: "Mão de obra", value: r.custoMaoObra },
    ...(r.custoExtras > 0 ? [{ label: "Extras", value: r.custoExtras }] : []),
  ];

  const padraoMarkup = r.markups.find((m) => m.destaque)?.markup ?? 50;

  return (
    <div className="space-y-4">
      {/* Resultado principal */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Custo por peça</p>
          <p className="text-2xl font-bold text-primary">{formatBRL(r.custoTotal)}</p>
        </Card>
        <Card className="p-4 shadow-sm bg-secondary text-secondary-foreground">
          <p className="text-xs opacity-80">Preço sugerido ({padraoMarkup}%)</p>
          <p className="text-2xl font-bold">{formatBRL(r.precoSugerido)}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Lucro / peça</p>
          <p className="text-2xl font-bold text-primary">{formatBRL(r.lucroPorPeca)}</p>
          <p className="text-xs text-muted-foreground">margem real {r.margemReal}%</p>
        </Card>
      </div>

      {/* Breakdown de custos */}
      <Card className="p-5 shadow-sm">
        <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4" /> Breakdown de custos (por peça)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {custos.map((c) => (
            <div key={c.label} className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="font-semibold">{formatBRL(c.value)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabela de markup */}
      <Card className="p-5 shadow-sm">
        <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Tabela de markup
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Markup</TableHead>
                <TableHead className="text-right">Preço unit.</TableHead>
                <TableHead className="text-right">c/ desc. 10%</TableHead>
                <TableHead className="text-right">c/ nota +6%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.markups.map((m) => (
                <TableRow
                  key={m.markup}
                  className={m.destaque ? "bg-[hsl(var(--secondary)/0.08)] font-semibold" : ""}
                >
                  <TableCell>
                    {m.markup}%{" "}
                    {m.destaque && (
                      <span className="ml-1 text-xs text-secondary">★ padrão</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatBRL(m.precoUnit)}</TableCell>
                  <TableCell className="text-right">{formatBRL(m.comDesconto10)}</TableCell>
                  <TableCell className="text-right">{formatBRL(m.comNota6)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Info do lote */}
      <Card className="p-5 shadow-sm bg-[hsl(var(--muted))]">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
          <Info className="h-4 w-4" /> Informações do lote
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Info2 label="Rodadas" value={String(r.rodadas)} />
          <Info2 label="Tempo total" value={`~${r.horasTotais}h`} />
          <Info2 label="Peso total" value={`${r.pesoTotalG}g`} />
          <Info2 label="Rolos de filamento" value={String(r.rolosFilamento)} />
        </div>
        <p className="text-sm text-foreground/80 mt-3 border-t border-border pt-3">
          {r.recomendacao}
        </p>
      </Card>
    </div>
  );
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
