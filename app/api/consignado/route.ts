import { NextRequest, NextResponse } from "next/server";
import { listConsignado, createConsignado, updateConsignado } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listConsignado();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.cliente || body.valorConsignado == null) {
      return NextResponse.json(
        { error: "Cliente e Valor consignado são obrigatórios" },
        { status: 400 }
      );
    }
    await createConsignado(body);
    return NextResponse.json({ ok: true }, { status: 201 });
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
    await updateConsignado(body.rowNumber, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
