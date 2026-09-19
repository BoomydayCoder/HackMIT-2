import { NextResponse } from "next/server";
import { currentUser, findProfile, updateProfile } from "@/lib/accounts";
import { friendState } from "@/lib/friends";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username");
  const session = await currentUser();
  const target = username ?? session?.user.username;
  if (!target) return NextResponse.json({ error: "Sign in to see your profile." }, { status: 401 });

  const profile = await findProfile(target);
  if (!profile) return NextResponse.json({ error: "No such player." }, { status: 404 });

  const friend = session ? await friendState(session.user.username, profile.username) : "none";
  return NextResponse.json({
    profile,
    friend,
    isSelf: session?.user.username.toLowerCase() === profile.username.toLowerCase(),
  });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed profile." }, { status: 400 });
  }
  const fields = (body ?? {}) as { bio?: unknown; avatar?: unknown };
  const profile = await updateProfile({
    bio: typeof fields.bio === "string" ? fields.bio : undefined,
    avatar: typeof fields.avatar === "string" ? fields.avatar : undefined,
  });
  if (!profile) return NextResponse.json({ error: "Sign in to edit your profile." }, { status: 401 });
  return NextResponse.json({ profile });
}
