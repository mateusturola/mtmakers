import { NextRequest, NextResponse } from "next/server";
import { listRetiradas, createRetirada } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listRetiradas();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.descricao || body.valor == null) {
      return NextResponse.json(
        { error: "Descrição e Valor são obrigatórios" },
        { status: 400 }
      );
    }
    await createRetirada(body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
