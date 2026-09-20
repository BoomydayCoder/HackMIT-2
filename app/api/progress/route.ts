import { NextResponse } from "next/server";
import { currentUser, saveProgress } from "@/lib/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The saved progress, so a client can pick up a rating change made server-side. */
export async function GET() {
  const session = await currentUser();
  if (!session) return NextResponse.json({ error: "Sign in to load progress." }, { status: 401 });
  return NextResponse.json({ progress: session.progress });
}

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
