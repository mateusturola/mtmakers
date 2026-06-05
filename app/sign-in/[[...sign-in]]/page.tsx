import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/layout/Logo";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <Logo width={220} />
      {/* Cadastro público desativado: oculta o link "Cadastre-se" do widget. */}
      <SignIn appearance={{ elements: { footerAction: "hidden" } }} />
    </div>
  );
}
