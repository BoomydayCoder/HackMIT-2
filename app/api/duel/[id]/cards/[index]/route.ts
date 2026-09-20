import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";
import {
  attemptsUsed,
  boardFor,
  cardFor,
  duelStatus,
  DUEL_RIGOR,
  MAX_ATTEMPTS,
  submitAttempt,
} from "@/lib/duel";
import { gradeProof } from "@/lib/grade-proof";
import {
  DEFAULT_MODEL,
  isModelId,
  PASS_SCORE,
  type ModelId,
} from "@/lib/grader";
import { getProblem } from "@/lib/problems";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; index: string }> };

const unauthorised = () =>
  NextResponse.json({ error: "Sign in to duel." }, { status: 401 });

export async function GET(_request: Request, context: Context) {
  const session = await currentUser();
  if (!session) return unauthorised();

  const { id, index } = await context.params;
  const card = await cardFor(id, Number(index), session.user.username);
  if (!card) return NextResponse.json({ error: "No such card." }, { status: 404 });
  return NextResponse.json({ card });
}

/** Grades a duel attempt server-side; only the server may award the card. */
export async function POST(request: Request, context: Context) {
  const session = await currentUser();
  if (!session) return unauthorised();

  const { id, index } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  const { proof } = (body ?? {}) as { proof?: unknown };
  if (typeof proof !== "string" || !proof.trim() || proof.length > 20000) {
    return NextResponse.json(
      { error: "A proof of 1–20,000 characters is required." },
      { status: 400 },
    );
  }

  const state = await attemptsUsed(id, Number(index), session.user.username);
  if (!state) return NextResponse.json({ error: "No such card." }, { status: 404 });
  if ((await duelStatus(id)) !== "active") {
    return NextResponse.json({ error: "This duel is over." }, { status: 409 });
  }
  if (state.claimed) {
    return NextResponse.json({ error: "This card has already been claimed." }, { status: 409 });
  }
  if (state.used >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: `No submissions left on this card (${MAX_ATTEMPTS} maximum).` },
      { status: 409 },
    );
  }

  const problem = getProblem(state.cardId);
  if (!problem) return NextResponse.json({ error: "No such card." }, { status: 404 });

  const model: ModelId = isModelId(process.env.OPENAI_MODEL)
    ? process.env.OPENAI_MODEL
    : DEFAULT_MODEL;
  const outcome = await gradeProof(problem, proof, DUEL_RIGOR, model);
  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });

  const recorded = await submitAttempt(
    id,
    Number(index),
    session.user.username,
    outcome.grade.score,
  );
  if (!recorded) return NextResponse.json({ error: "No such card." }, { status: 404 });

  return NextResponse.json({
    ...outcome.grade,
    pass: outcome.grade.score >= PASS_SCORE,
    claimed: recorded.claimed,
    attemptsLeft: recorded.attemptsLeft,
    board: await boardFor(id, session.user.username),
  });
}
