import { redirect } from "next/navigation";

// Cadastro público desativado — qualquer acesso a /sign-up vai para o login.
export default function SignUpPage() {
  redirect("/sign-in");
}
