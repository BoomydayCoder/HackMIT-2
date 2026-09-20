import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";
import { accept, boardFor, decline } from "@/lib/duel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const unauthorised = () =>
  NextResponse.json({ error: "Sign in to duel." }, { status: 401 });

export async function GET(_request: Request, context: Context) {
  const session = await currentUser();
  if (!session) return unauthorised();

  const { id } = await context.params;
  const board = await boardFor(id, session.user.username);
  if (!board) return NextResponse.json({ error: "No such duel." }, { status: 404 });
  return NextResponse.json({ board });
}

export async function POST(request: Request, context: Context) {
  const session = await currentUser();
  if (!session) return unauthorised();

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  const { action } = (body ?? {}) as { action?: unknown };

  if (action === "decline") {
    await decline(id, session.user.username);
    return NextResponse.json({ board: null });
  }
  if (action !== "accept") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  if (!(await accept(id, session.user.username))) {
    return NextResponse.json({ error: "That challenge is no longer open." }, { status: 409 });
  }
  return NextResponse.json({ board: await boardFor(id, session.user.username) });
}
