export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GrantResponse = { access_token?: string; expires_in?: number };

export async function POST() {
  if (!process.env.DEEPGRAM_API_KEY) {
    return Response.json(
      { error: "DEEPGRAM_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let response: Response;
  try {
    response = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl_seconds: 60 }),
    });
  } catch {
    return Response.json({ error: "Unable to reach Deepgram" }, { status: 502 });
  }

  const payload = (await response.json().catch(() => ({}))) as GrantResponse;
  if (!response.ok || !payload.access_token) {
    return Response.json(
      { error: `Deepgram refused the token request (${response.status})` },
      { status: 502 },
    );
  }

  return Response.json(
    { accessToken: payload.access_token, expiresIn: payload.expires_in ?? 30 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
