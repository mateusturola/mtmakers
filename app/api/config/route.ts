import { NextRequest, NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/data";
import { DEFAULT_CONFIG } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getConfig();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    // Garante todas as chaves (mescla com o padrão).
    await saveConfig({ ...DEFAULT_CONFIG, ...body });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
