import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { ShieldAlert, LogOut } from "lucide-react";

export default function NaoAutorizadoPage() {
  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-md">
      <Logo width={200} />
      <div className="grid place-items-center h-14 w-14 rounded-full bg-[#ffe2e2]">
        <ShieldAlert className="h-7 w-7 text-destructive" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">Acesso não autorizado</h1>
        <p className="text-muted-foreground mt-2">
          Esta conta não tem permissão para acessar o sistema da MT Makers. Se você é da
          equipe, peça ao administrador para liberar o seu e-mail.
        </p>
      </div>
      <SignOutButton redirectUrl="/sign-in">
        <Button variant="outline">
          <LogOut className="h-4 w-4" /> Sair e entrar com outra conta
        </Button>
      </SignOutButton>
    </div>
  );
}
