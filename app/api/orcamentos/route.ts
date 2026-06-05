import { NextRequest, NextResponse } from "next/server";
import { listOrcamentos, createOrcamento, updateOrcamento } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listOrcamentos();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.cliente || !body.produtos || body.total == null) {
      return NextResponse.json(
        { error: "Cliente, produtos e total são obrigatórios" },
        { status: 400 }
      );
    }
    const result = await createOrcamento(body);
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
    await updateOrcamento(body.rowNumber, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
