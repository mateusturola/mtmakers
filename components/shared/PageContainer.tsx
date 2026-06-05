import { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="px-5 lg:px-8 py-6 max-w-[1400px] mx-auto w-full">{children}</div>;
}
