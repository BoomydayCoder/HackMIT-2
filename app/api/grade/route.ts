import { getProblem } from "@/lib/problems";
import { GRADER_SYSTEM_PROMPT } from "@/lib/grader";

export const runtime = "nodejs";

const gradeSchema = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 7 },
    verdict: { type: "string" },
    summary: { type: "string" },
    feedback: { type: "array", items: { type: "string" } },
    gaps: { type: "array", items: { type: "string" } },
  },
  required: ["score", "verdict", "summary", "feedback", "gaps"],
  additionalProperties: false,
};

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

function upstreamMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return fallback;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const problemId =
    body && typeof body === "object" && "problemId" in body
      ? body.problemId
      : undefined;
  const proof =
    body && typeof body === "object" && "proof" in body ? body.proof : undefined;

  if (
    typeof problemId !== "string" ||
    typeof proof !== "string" ||
    proof.trim().length < 1 ||
    proof.length > 20000
  ) {
    return Response.json(
      { error: "problemId and proof are required; proof must be 1–20,000 characters" },
      { status: 400 },
    );
  }

  const problem = getProblem(problemId);
  if (!problem) {
    return Response.json({ error: "Problem not found" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const userMessage = `PROBLEM STATEMENT
---
${problem.statement}
---

OFFICIAL SOLUTION
---
${problem.solution}
---

STUDENT PROOF
---
${proof}
---`;

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 1200,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "grade",
            strict: true,
            schema: gradeSchema,
          },
        },
        messages: [
          { role: "system", content: GRADER_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });
  } catch {
    return Response.json({ error: "Unable to reach the grading service" }, { status: 502 });
  }

  const payload = (await response.json().catch(() => ({}))) as OpenAIResponse;
  if (!response.ok) {
    return Response.json(
      {
        error: upstreamMessage(
          payload,
          `OpenAI request failed with status ${response.status}`,
        ),
      },
      { status: 502 },
    );
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return Response.json({ error: "OpenAI returned an empty grading response" }, { status: 502 });
  }

  try {
    const grade = JSON.parse(content) as {
      score: number;
      verdict: string;
      summary: string;
      feedback: string[];
      gaps: string[];
    };
    return Response.json({ ...grade, model });
  } catch {
    return Response.json({ error: "OpenAI returned an invalid grading response" }, { status: 502 });
  }
}
