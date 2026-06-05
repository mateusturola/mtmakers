import { NextRequest, NextResponse } from "next/server";
import { listEntradas, createEntrada } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listEntradas();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.produto || !body.qtd) {
      return NextResponse.json(
        { error: "Produto e Quantidade são obrigatórios" },
        { status: 400 }
      );
    }
    await createEntrada(body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
