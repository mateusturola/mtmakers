import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { effectiveRole } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ data: null });
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    const role = effectiveRole(email, user?.publicMetadata as Record<string, unknown>);
    return NextResponse.json({
      data: { email, role, nome: user?.firstName || "" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
