import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Inbox } from "lucide-react";

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-9 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-xl" />
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center py-16 text-center text-muted-foreground">
      <Inbox className="h-10 w-10 mb-3 opacity-40" />
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center py-12 text-center">
      <AlertCircle className="h-10 w-10 mb-3 text-destructive" />
      <p className="font-medium text-destructive">Não foi possível carregar os dados</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{message}</p>
      <p className="text-xs text-muted-foreground mt-3">
        Verifique as variáveis de ambiente (Google Sheets / Claude) no arquivo
        <code className="mx-1 rounded bg-muted px-1">.env.local</code>.
      </p>
    </div>
  );
}
