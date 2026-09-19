import { getProblem } from "@/lib/problems";
import {
  DEFAULT_MODEL,
  DEFAULT_RIGOR,
  graderSystemPrompt,
  isModelId,
  isRigorLevel,
  MAX_SCORE,
  type ModelId,
  type RigorLevel,
} from "@/lib/grader";

export const runtime = "nodejs";

const gradeSchema = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: MAX_SCORE },
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
  const requestedRigor =
    body && typeof body === "object" && "rigor" in body ? body.rigor : undefined;
  const requestedModel =
    body && typeof body === "object" && "model" in body ? body.model : undefined;

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

  if (
    body &&
    typeof body === "object" &&
    "rigor" in body &&
    !isRigorLevel(requestedRigor)
  ) {
    return Response.json({ error: "rigor must be 1–5" }, { status: 400 });
  }

  if (
    body &&
    typeof body === "object" &&
    "model" in body &&
    !isModelId(requestedModel)
  ) {
    return Response.json({ error: "unknown model" }, { status: 400 });
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

  const rigor: RigorLevel = isRigorLevel(requestedRigor)
    ? requestedRigor
    : DEFAULT_RIGOR;
  const model: ModelId = isModelId(requestedModel)
    ? requestedModel
    : isModelId(process.env.OPENAI_MODEL)
      ? process.env.OPENAI_MODEL
      : DEFAULT_MODEL;
  const officialAnswer = problem.answer
    ? `OFFICIAL ANSWER
---
Official answer: ${problem.answer}
---

`
    : "";
  const userMessage = `PROBLEM SET
---
Problem set: ${problem.set}
---

PROBLEM STATEMENT
---
${problem.statement}
---

${officialAnswer}OFFICIAL SOLUTION
---
${problem.solution}
---

STUDENT PROOF
---
${proof}
---`;

  const completionRequest = {
    model,
    max_completion_tokens: 4000,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "grade",
        strict: true,
        schema: gradeSchema,
      },
    },
    messages: [
      { role: "system", content: graderSystemPrompt(rigor) },
      { role: "user", content: userMessage },
    ],
  };
  const openAIRequest =
    model === "gpt-4o-mini"
      ? { ...completionRequest, temperature: 0 }
      : completionRequest;

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(openAIRequest),
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
    return Response.json({ ...grade, model, rigor });
  } catch {
    return Response.json({ error: "OpenAI returned an invalid grading response" }, { status: 502 });
  }
}
