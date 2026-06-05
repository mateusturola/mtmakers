import { NextRequest, NextResponse } from "next/server";
import { listClientes, createCliente, updateCliente, deleteCliente } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listClientes();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nome || !body.whatsapp || !body.tipo) {
      return NextResponse.json(
        { error: "Nome, WhatsApp e Tipo são obrigatórios" },
        { status: 400 }
      );
    }
    const cliente = await createCliente(body);
    return NextResponse.json({ data: cliente }, { status: 201 });
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
    await updateCliente(body.rowNumber, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rowNumber = Number(searchParams.get("rowNumber"));
    if (!rowNumber) {
      return NextResponse.json({ error: "rowNumber obrigatório" }, { status: 400 });
    }
    await deleteCliente(rowNumber);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
