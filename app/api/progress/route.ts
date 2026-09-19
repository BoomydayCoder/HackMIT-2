import { NextResponse } from "next/server";
import { saveProgress } from "@/lib/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed progress." }, { status: 400 });
  }
  const user = await saveProgress(body);
  if (!user) return NextResponse.json({ error: "Sign in to save progress." }, { status: 401 });
  return NextResponse.json({ user });
}
