import { NextRequest, NextResponse } from "next/server";
import {
  listAdicionais,
  createAdicional,
  updateAdicional,
  deleteAdicional,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listAdicionais();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nome || body.custoEmbalagem == null || !body.rendimento) {
      return NextResponse.json(
        { error: "Nome, custo da embalagem e rendimento são obrigatórios" },
        { status: 400 }
      );
    }
    await createAdicional(body);
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
    await updateAdicional(body.rowNumber, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const rowNumber = Number(new URL(req.url).searchParams.get("rowNumber"));
    if (!rowNumber) {
      return NextResponse.json({ error: "rowNumber obrigatório" }, { status: 400 });
    }
    await deleteAdicional(rowNumber);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
