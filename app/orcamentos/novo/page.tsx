import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { DocumentoForm } from "@/components/shared/DocumentoForm";

export default function NovoOrcamentoPage() {
  return (
    <>
      <Header title="Novo Orçamento" subtitle="Cadastrar um novo orçamento" />
      <PageContainer>
        <DocumentoForm tipo="orcamento" />
      </PageContainer>
    </>
  );
}
