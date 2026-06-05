import { NextRequest, NextResponse } from "next/server";
import { listPedidos, createPedido, updatePedido } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listPedidos();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.cliente || !body.produto || !body.qtd) {
      return NextResponse.json(
        { error: "Cliente, Produto e Quantidade são obrigatórios" },
        { status: 400 }
      );
    }
    const result = await createPedido(body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.rowNumber) {
      return NextResponse.json({ error: "rowNumber obrigatório" }, { status: 400 });
    }
    await updatePedido(body.rowNumber, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
