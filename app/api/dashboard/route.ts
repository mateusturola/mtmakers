import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDashboard();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
