import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";
import { challenge, invitesFor } from "@/lib/duel";
import { DEFAULT_TIER, DUEL_TIERS, type DuelTierId } from "@/lib/duel-tiers";
import { friendState } from "@/lib/friends";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unauthorised = () =>
  NextResponse.json({ error: "Sign in to duel." }, { status: 401 });

export async function GET() {
  const session = await currentUser();
  if (!session) return unauthorised();
  return NextResponse.json({ duels: await invitesFor(session.user.username) });
}

export async function POST(request: Request) {
  const session = await currentUser();
  if (!session) return unauthorised();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  const { username, tier } = (body ?? {}) as { username?: unknown; tier?: unknown };
  if (typeof username !== "string" || !username) {
    return NextResponse.json({ error: "Which player?" }, { status: 400 });
  }
  const tierId = DUEL_TIERS.some((option) => option.id === tier)
    ? (tier as DuelTierId)
    : DEFAULT_TIER;

  if ((await friendState(session.user.username, username)) !== "friends") {
    return NextResponse.json({ error: "You can only challenge an ally." }, { status: 403 });
  }

  const id = await challenge(session.user.username, username, tierId);
  if (!id) return NextResponse.json({ error: "You cannot duel yourself." }, { status: 400 });
  return NextResponse.json({ id, duels: await invitesFor(session.user.username) });
}
