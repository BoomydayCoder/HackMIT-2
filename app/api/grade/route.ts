import { gradeProof } from "@/lib/grade-proof";
import { getProblem } from "@/lib/problems";
import {
  DEFAULT_MODEL,
  DEFAULT_RIGOR,
  isModelId,
  isRigorLevel,
  type ModelId,
  type RigorLevel,
} from "@/lib/grader";

export const runtime = "nodejs";

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

  const rigor: RigorLevel = isRigorLevel(requestedRigor)
    ? requestedRigor
    : DEFAULT_RIGOR;
  const model: ModelId = isModelId(requestedModel)
    ? requestedModel
    : isModelId(process.env.OPENAI_MODEL)
      ? process.env.OPENAI_MODEL
      : DEFAULT_MODEL;

  const outcome = await gradeProof(problem, proof, rigor, model);
  if (!outcome.ok) {
    return Response.json({ error: outcome.error }, { status: outcome.status });
  }

  return Response.json({ ...outcome.grade, model, rigor });
}
