import Image from "next/image";
import { cn } from "@/lib/utils";

const RATIO = 85 / 479; // proporção original da logo

interface LogoProps {
  /** Em fundo escuro (sidebar) envolve num chip branco. */
  chip?: boolean;
  width?: number;
  className?: string;
}

export function Logo({ chip = false, width = 150, className }: LogoProps) {
  const img = (
    <Image
      src="/logo-mt.png"
      alt="MT Makers"
      width={width}
      height={Math.round(width * RATIO)}
      priority
      style={{ width, height: "auto" }}
    />
  );

  if (chip) {
    return (
      <div className={cn("inline-flex items-center rounded-lg bg-white px-3 py-2", className)}>
        {img}
      </div>
    );
  }
  return <div className={cn("inline-flex items-center", className)}>{img}</div>;
}
