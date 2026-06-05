import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 lg:px-8 py-4 pl-16 lg:pl-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </header>
  );
}
