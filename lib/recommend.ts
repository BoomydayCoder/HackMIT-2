import learned from "@/data/problem-embeddings.json";
import type { Reviews } from "@/lib/progress";
import { TOPICS } from "@/lib/rating";

/**
 * Content-based taste model for the deck.
 *
 * Every problem gets a vector: either a learned embedding exported by
 * `ml/train.py` into data/problem-embeddings.json, or, when the model has not
 * been trained yet, hand-made content features (topic, level, Elo and a hashed
 * bag of words of the statement). A player's taste is the list of problems
 * they have rated, and a candidate's predicted stars are the similarity-
 * weighted average of those ratings, shrunk toward neutral by a prior so a
 * single lukewarm review moves it less than a rave. `ml/features.py` mirrors
 * the features and `ml/model.py` the scorer, so the trained model produces
 * embeddings this file consumes unchanged.
 */

export const TEXT_DIM = 64;
export const NEUTRAL_STARS = 3;
export const MAX_STARS = 5;
/** Weight of the neutral prior, in units of similarity; mirrored by ml/model.py. */
export const PRIOR_WEIGHT = 1;
export const MAX_LEVEL = 9;
export const ELO_SCALE = 2500;

type Embeddable = { id: string; topic: string; level: number; elo: number; statement: string };

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

/** A player's taste: every problem they have rated, with its vector. Null until they rate one. */
export type Taste = { vector: number[]; stars: number }[];

export function tasteProfile<T extends Embeddable>(problems: T[], reviews: Reviews): Taste | null {
  const taste: Taste = [];
  for (const problem of problems) {
    const stars = reviews[problem.id];
    if (stars) taste.push({ vector: problemVector(problem), stars });
  }
  return taste.length > 0 ? taste : null;
}

/**
 * Predicted stars for a problem: the average of the player's ratings weighted
 * by (non-negative) similarity, pulled toward neutral by the prior. Neutral
 * when there is no taste yet.
 */
export function predictStars(problem: Embeddable, taste: Taste | null): number {
  if (!taste) return NEUTRAL_STARS;
  const vector = problemVector(problem);
  let weighted = PRIOR_WEIGHT * NEUTRAL_STARS;
  let total = PRIOR_WEIGHT;
  for (const entry of taste) {
    const similarity = Math.max(0, cosine(vector, entry.vector));
    weighted += similarity * entry.stars;
    total += similarity;
  }
  return weighted / total;
}

/** Predicted stars rescaled to [-1, 1]: negative for problems the player would dislike. */
export function affinity(problem: Embeddable, taste: Taste | null): number {
  return (predictStars(problem, taste) - NEUTRAL_STARS) / (MAX_STARS - NEUTRAL_STARS);
}

/** Predicted stars as a 0–100 match percentage; 50 is neutral. */
export function matchPercent(problem: Embeddable, taste: Taste | null): number {
  return Math.round(((predictStars(problem, taste) - 1) / (MAX_STARS - 1)) * 100);
}

/** Highest predicted-star problems, excluding those already reviewed. */
export function recommend<T extends Embeddable>(
  problems: T[],
  reviews: Reviews,
  limit: number,
  excluded: string[] = [],
): T[] {
  const taste = tasteProfile(problems, reviews);
  if (!taste) return [];
  return problems
    .filter((problem) => !(problem.id in reviews) && !excluded.includes(problem.id))
    .map((problem) => ({ problem, score: predictStars(problem, taste) }))
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
