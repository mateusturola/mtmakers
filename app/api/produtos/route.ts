import { NextRequest, NextResponse } from "next/server";
import { listProdutos, createProduto, updateProduto } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listProdutos();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.peca || !body.categoria) {
      return NextResponse.json(
        { error: "Peça e Categoria são obrigatórias" },
        { status: 400 }
      );
    }
    const produto = await createProduto(body);
    return NextResponse.json({ data: produto }, { status: 201 });
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
    await updateProduto(body.rowNumber, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
