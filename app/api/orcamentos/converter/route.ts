import { NextRequest, NextResponse } from "next/server";
import { converterOrcamentoEmPedido } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.rowNumber) {
      return NextResponse.json({ error: "rowNumber obrigatório" }, { status: 400 });
    }
    const result = await converterOrcamentoEmPedido(body.rowNumber);
    return NextResponse.json({ data: result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
