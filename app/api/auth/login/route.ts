import { NextResponse } from "next/server";
import { signIn } from "@/lib/accounts";
import { readCredentials } from "@/lib/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const credentials = await readCredentials(request);
  if (!credentials) return NextResponse.json({ error: "Enter a username and password." }, { status: 400 });
  const result = await signIn(credentials.username, credentials.password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  return NextResponse.json({ user: result.user, progress: result.progress });
}
