import learned from "@/data/problem-embeddings.json";
import { jaccard } from "@/lib/key-ideas";
import type { Reviews } from "@/lib/progress";
import { TOPICS } from "@/lib/rating";

/**
 * Taste model for the deck.
 *
 * Match% is built from three explicit comparisons between a candidate and each
 * problem the player has rated: same subject, distance in difficulty and the
 * overlap of the key ideas of their solutions (`kinship`). Each rating counts
 * with a confidence of |stars - 3| / 2, so 1★ and 5★ are the loudest signals
 * and 3★ says nothing. A 5★ pulls kindred problems up; a 1★ pushes them down,
 * which is the same as pulling *unlike* problems up. A single 4★ moves the
 * number half as far as a 5★.
 *
 * Problem vectors (learned embeddings from `ml/train.py`, else hand-made
 * content features) remain for nearest-neighbour "If you like this one" lists.
 */

export const TEXT_DIM = 64;
export const NEUTRAL_STARS = 3;
export const MAX_STARS = 5;
export const MAX_LEVEL = 9;
export const ELO_SCALE = 2500;

/** Relative weights of the three kinship components; they sum to 1. */
export const SUBJECT_WEIGHT = 0.3;
export const DIFFICULTY_WEIGHT = 0.3;
export const IDEAS_WEIGHT = 0.4;
/** Level gap at which the difficulty component reaches zero. */
export const LEVEL_SPAN = 4;

type Embeddable = { id: string; topic: string; level: number; elo: number; statement: string };

export type Matchable = Embeddable & { keyIdeas: readonly string[] };

type LearnedEmbeddings = { dim: number; problems: Record<string, number[]> };

const LEARNED = learned as LearnedEmbeddings;

/** Lower-cases, strips TeX and punctuation, and keeps alphanumeric tokens of 2+ chars. */
export function tokenize(statement: string): string[] {
  return statement
    .toLowerCase()
    .replace(/\\[a-z]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length >= 2);
}

/** 32-bit FNV-1a; small, dependency-free and identical in the Python pipeline. */
export function fnv1a(token: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Hand-made features: topic one-hot, level, Elo, then L2-normalised hashed text counts. */
export function contentFeatures(problem: Embeddable): number[] {
  const topic = TOPICS.map((entry) => (entry === problem.topic ? 1 : 0));
  const scalars = [problem.level / MAX_LEVEL, problem.elo / ELO_SCALE];
  const text = new Array<number>(TEXT_DIM).fill(0);
  for (const token of tokenize(problem.statement)) text[fnv1a(token) % TEXT_DIM] += 1;
  const norm = Math.hypot(...text) || 1;
  return [...topic, ...scalars, ...text.map((count) => count / norm)];
}

export function hasLearnedEmbeddings(): boolean {
  return LEARNED.dim > 0 && Object.keys(LEARNED.problems).length > 0;
}

/** The learned embedding when the model has one for this problem, else content features. */
export function problemVector(problem: Embeddable): number[] {
  const embedding = LEARNED.problems[problem.id];
  if (embedding && embedding.length === LEARNED.dim) return embedding;
  return contentFeatures(problem);
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}

/** A player's taste: every problem they have rated. Null until they rate one. */
export type Taste = { problem: Matchable; stars: number }[];

export function tasteProfile<T extends Matchable>(problems: T[], reviews: Reviews): Taste | null {
  const taste: Taste = [];
  for (const problem of problems) {
    const stars = reviews[problem.id];
    if (stars) taste.push({ problem, stars });
  }
  return taste.length > 0 ? taste : null;
}

/** 1 for the same subject, else 0. */
export function subjectMatch(a: Matchable, b: Matchable): number {
  return a.topic === b.topic ? 1 : 0;
}

/** 1 for the same level, falling linearly to 0 at a gap of LEVEL_SPAN levels. */
export function difficultyMatch(a: Matchable, b: Matchable): number {
  return Math.max(0, 1 - Math.abs(a.level - b.level) / LEVEL_SPAN);
}

/** Jaccard overlap of the key ideas of the two solutions. */
export function ideasMatch(a: Matchable, b: Matchable): number {
  return jaccard(a.keyIdeas, b.keyIdeas);
}

/** How alike two problems are, in [0, 1]: the weighted sum of the three components. */
export function kinship(a: Matchable, b: Matchable): number {
  return (
    SUBJECT_WEIGHT * subjectMatch(a, b) +
    DIFFICULTY_WEIGHT * difficultyMatch(a, b) +
    IDEAS_WEIGHT * ideasMatch(a, b)
  );
}

/** How much a rating tells us, in [0, 1]: 0 for 3★, 1 for 1★ or 5★. */
export function confidence(stars: number): number {
  return Math.abs(stars - NEUTRAL_STARS) / (MAX_STARS - NEUTRAL_STARS);
}

/**
 * Taste affinity in [-1, 1]: a problem is for you if it resembles something
 * you loved, or is clearly unlike something you hated, and does not resemble
 * anything you hated. Each rating's kinship is scaled by its confidence, and
 * the strongest single reason wins rather than an average, so a new decisive
 * rating is never diluted by unrelated earlier ones.
 *
 *   pull  = max over liked     of confidence · kinship
 *   dodge = max over disliked  of confidence · (1 - kinship)
 *   push  = max over disliked  of confidence · kinship
 *   affinity = max(pull, dodge) - push
 */
export function affinity(problem: Matchable, taste: Taste | null): number {
  if (!taste) return 0;
  let pull = 0;
  let dodge = 0;
  let push = 0;
  for (const entry of taste) {
    const weight = confidence(entry.stars);
    if (weight === 0) continue;
    const alike = kinship(problem, entry.problem);
    if (entry.stars > NEUTRAL_STARS) {
      pull = Math.max(pull, weight * alike);
    } else {
      dodge = Math.max(dodge, weight * (1 - alike));
      push = Math.max(push, weight * alike);
    }
  }
  return Math.max(-1, Math.min(1, Math.max(pull, dodge) - push));
}

/** Affinity as a 0–100 match percentage; 50 is neutral. */
export function matchPercent(problem: Matchable, taste: Taste | null): number {
  return Math.round(50 + 50 * affinity(problem, taste));
}

/** Key ideas the candidate shares with the player's best-rated problems, most-shared first. */
export function sharedIdeas(problem: Matchable, taste: Taste | null): string[] {
  if (!taste) return [];
  const votes = new Map<string, number>();
  for (const entry of taste) {
    if (entry.stars <= NEUTRAL_STARS) continue;
    const weight = confidence(entry.stars);
    for (const idea of entry.problem.keyIdeas) {
      if (problem.keyIdeas.includes(idea)) votes.set(idea, (votes.get(idea) ?? 0) + weight);
    }
  }
  return [...votes.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([idea]) => idea);
}

/** Highest-match problems, excluding those already reviewed. */
export function recommend<T extends Matchable>(
  problems: T[],
  reviews: Reviews,
  limit: number,
  excluded: string[] = [],
): T[] {
  const taste = tasteProfile(problems, reviews);
  if (!taste) return [];
  return problems
    .filter((problem) => !(problem.id in reviews) && !excluded.includes(problem.id))
    .map((problem) => ({ problem, score: affinity(problem, taste) }))
    .sort((a, b) => b.score - a.score || a.problem.id.localeCompare(b.problem.id))
    .slice(0, limit)
    .map((entry) => entry.problem);
}

/** Nearest neighbours of a problem in vector space. */
export function similarProblems<T extends Embeddable>(problems: T[], target: T, limit: number): T[] {
  const vector = problemVector(target);
  return problems
    .filter((problem) => problem.id !== target.id)
    .map((problem) => ({ problem, score: cosine(problemVector(problem), vector) }))
    .sort((a, b) => b.score - a.score || a.problem.id.localeCompare(b.problem.id))
    .slice(0, limit)
    .map((entry) => entry.problem);
}
