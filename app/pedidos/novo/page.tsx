import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { PedidoForm } from "@/components/pedidos/PedidoForm";

export default function NovoPedidoPage() {
  return (
    <>
      <Header title="Novo Pedido" subtitle="Cadastrar um novo pedido" />
      <PageContainer>
        <PedidoForm />
      </PageContainer>
    </>
  );
}
