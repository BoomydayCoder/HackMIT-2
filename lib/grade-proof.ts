import type { Problem } from "@/lib/problems";
import { graderSystemPrompt, MAX_SCORE, type ModelId, type RigorLevel } from "@/lib/grader";

export type Grade = {
  score: number;
  verdict: string;
  summary: string;
  feedback: string[];
  gaps: string[];
};

export type GradeOutcome =
  | { ok: true; grade: Grade }
  | { ok: false; status: number; error: string };

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

type OpenAIResponse = { choices?: Array<{ message?: { content?: string | null } }> };

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

/**
 * The grading call itself, so both the training route and a duel submission
 * (which must score server-side before it may award a card) share one rubric.
 */
export async function gradeProof(
  problem: Problem,
  proof: string,
  rigor: RigorLevel,
  model: ModelId,
): Promise<GradeOutcome> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, status: 500, error: "OPENAI_API_KEY is not configured" };
  }

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
      json_schema: { name: "grade", strict: true, schema: gradeSchema },
    },
    messages: [
      { role: "system", content: graderSystemPrompt(rigor) },
      { role: "user", content: userMessage },
    ],
  };
  const openAIRequest =
    model === "gpt-4o-mini" ? { ...completionRequest, temperature: 0 } : completionRequest;

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
    return { ok: false, status: 502, error: "Unable to reach the grading service" };
  }

  const payload = (await response.json().catch(() => ({}))) as OpenAIResponse;
  if (!response.ok) {
    return {
      ok: false,
      status: 502,
      error: upstreamMessage(payload, `OpenAI request failed with status ${response.status}`),
    };
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return { ok: false, status: 502, error: "OpenAI returned an empty grading response" };
  }

  try {
    return { ok: true, grade: JSON.parse(content) as Grade };
  } catch {
    return { ok: false, status: 502, error: "OpenAI returned an invalid grading response" };
  }
}
