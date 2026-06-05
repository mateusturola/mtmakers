import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/shared/PageContainer";
import { CalculadoraIA } from "@/components/calculadora/CalculadoraIA";

export default function CalculadoraPage() {
  return (
    <>
      <Header
        title="Calculadora de Preços"
        subtitle="Precificação de peças 3D com os custos reais da MT Makers"
      />
      <PageContainer>
        <CalculadoraIA />
      </PageContainer>
    </>
  );
}
