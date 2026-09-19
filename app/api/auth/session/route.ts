import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await currentUser();
  return NextResponse.json(session ?? { user: null });
}
