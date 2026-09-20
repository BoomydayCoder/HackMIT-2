import { NextResponse } from "next/server";
import { currentUser, searchUsers } from "@/lib/accounts";
import { listFriends, removeFriend, requestFriend } from "@/lib/friends";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unauthorised = () =>
  NextResponse.json({ error: "Sign in to link with other players." }, { status: 401 });

export async function GET(request: Request) {
  const session = await currentUser();
  if (!session) return unauthorised();

  const term = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const friends = await listFriends(session.user.username);
  const matches = term
    ? (await searchUsers(term)).filter((name) => name !== session.user.username)
    : [];
  return NextResponse.json({ friends, matches });
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
  const { username } = (body ?? {}) as { username?: unknown };
  if (typeof username !== "string" || !username) {
    return NextResponse.json({ error: "Which player?" }, { status: 400 });
  }

  const state = await requestFriend(session.user.username, username);
  return NextResponse.json({ state, friends: await listFriends(session.user.username) });
}

export async function DELETE(request: Request) {
  const session = await currentUser();
  if (!session) return unauthorised();

  const username = new URL(request.url).searchParams.get("username");
  if (!username) return NextResponse.json({ error: "Which player?" }, { status: 400 });

  await removeFriend(session.user.username, username);
  return NextResponse.json({ friends: await listFriends(session.user.username) });
}
