export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Terms the recogniser would otherwise mangle. Nova-3 accepts a repeated
 * `keyterm` parameter in English and weights these towards being heard.
 */
const KEYTERMS = [
  "lemma",
  "modulo",
  "congruent",
  "integer",
  "rational",
  "polynomial",
  "coefficient",
  "isosceles",
  "quadrilateral",
  "bisector",
  "cyclic",
  "induction",
  "contradiction",
  "pigeonhole",
  "binomial",
  "factorial",
  "summation",
];

const LISTEN_URL = `https://api.deepgram.com/v1/listen?${new URLSearchParams([
  ["model", "nova-3"],
  ["language", "en"],
  ["smart_format", "true"],
  ["punctuate", "true"],
  ...KEYTERMS.map((term): [string, string] => ["keyterm", term]),
]).toString()}`;

const MAX_CLIP_BYTES = 25 * 1024 * 1024;

type DeepgramResponse = {
  results?: {
    channels?: Array<{ alternatives?: Array<{ transcript?: string }> }>;
  };
};

export async function POST(request: Request) {
  if (!process.env.DEEPGRAM_API_KEY) {
    return Response.json(
      { error: "Dictation is unavailable: DEEPGRAM_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const clip = await request.arrayBuffer();
  if (clip.byteLength === 0) {
    return Response.json({ error: "No audio was received." }, { status: 400 });
  }
  if (clip.byteLength > MAX_CLIP_BYTES) {
    return Response.json(
      { error: "That clip is too long — dictate a paragraph at a time." },
      { status: 413 },
    );
  }

  let response: Response;
  try {
    response = await fetch(LISTEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": request.headers.get("content-type") ?? "audio/webm",
      },
      body: clip,
    });
  } catch {
    return Response.json({ error: "Unable to reach Deepgram." }, { status: 502 });
  }

  if (!response.ok) {
    return Response.json(
      { error: `Deepgram refused the transcription (${response.status}).` },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as DeepgramResponse;
  const transcript =
    payload.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";

  return Response.json({ transcript }, { headers: { "Cache-Control": "no-store" } });
}
