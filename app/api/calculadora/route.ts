import { NextRequest, NextResponse } from "next/server";
import { calcularPreco } from "@/lib/pricing";
import { getConfig } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nome || !body.pesoGramas || !body.tempoImpressaoMin) {
      return NextResponse.json(
        { error: "Nome, peso e tempo de impressão são obrigatórios" },
        { status: 400 }
      );
    }
    const cfg = body.config || (await getConfig());
    const resultado = calcularPreco(
      {
        nome: body.nome,
        categoria: body.categoria || "Personalizado",
        pesoGramas: Number(body.pesoGramas),
        tempoImpressaoMin: Number(body.tempoImpressaoMin),
        qtdPorPlaca: Number(body.qtdPorPlaca) || 1,
        custoFilamentoPorKg: body.custoFilamentoPorKg
          ? Number(body.custoFilamentoPorKg)
          : undefined,
        tarifaEnergiaKwh: body.tarifaEnergiaKwh ? Number(body.tarifaEnergiaKwh) : undefined,
        materiaisExtras: body.materiaisExtras ? Number(body.materiaisExtras) : undefined,
        qtdPedido: body.qtdPedido ? Number(body.qtdPedido) : undefined,
      },
      cfg
    );
    return NextResponse.json({ data: resultado });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
