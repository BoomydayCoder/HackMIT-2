import { MAX_SCORE } from "@/lib/grader";
import { notifyProgress, RATINGS_KEY, subscribeProgress } from "@/lib/progress";

export const TOPICS = ["algebra", "combinatorics", "geometry", "number theory"] as const;
export const STARTING_RATING = 1000;

const PASS_PENALTY = 8;
const MIN_SOLVE_GAIN = 20;
const MAX_SOLVE_GAIN = 90;
/** A score of 3/5 is par: below it the grade costs rating, above it earns some. */
const PAR_SCORE = 3;
const MAX_GRADE_LOSS = 30;

export type Ratings = Record<string, number>;

/** Raw JSON of the per-topic ratings; a stable string so it can back a store snapshot. */
export function readRatingsRaw(): string {
  if (typeof window === "undefined") return "{}";
  return window.localStorage.getItem(RATINGS_KEY) ?? "{}";
}

export function parseRatings(raw: string): Ratings {
  const ratings: Ratings = Object.fromEntries(TOPICS.map((topic) => [topic, STARTING_RATING]));
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      for (const [topic, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof value === "number" && Number.isFinite(value)) ratings[topic] = Math.round(value);
      }
    }
  } catch {
    // fall through to the defaults
  }
  return ratings;
}

export function ratingFor(ratings: Ratings, topic: string): number {
  return ratings[topic] ?? STARTING_RATING;
}

function write(topic: string, value: number) {
  const ratings = parseRatings(readRatingsRaw());
  ratings[topic] = Math.max(100, Math.round(value));
  window.localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  notifyProgress();
  return ratings[topic];
}

/**
 * A graded proof moves the topic rating by how well it scored: full marks earn
 * the whole solve gain (itself larger the further the problem sits above you),
 * par leaves you where you were, and a bad proof costs you.
 */
export function recordGrade(topic: string, problemElo: number, score: number): number {
  const current = ratingFor(parseRatings(readRatingsRaw()), topic);
  const marks = Math.min(MAX_SCORE, Math.max(0, score));
  const delta =
    marks >= PAR_SCORE
      ? Math.min(MAX_SOLVE_GAIN, Math.max(MIN_SOLVE_GAIN, 40 + (problemElo - current) / 6)) *
        ((marks - PAR_SCORE) / (MAX_SCORE - PAR_SCORE))
      : -MAX_GRADE_LOSS * ((PAR_SCORE - marks) / PAR_SCORE);
  return write(topic, current + delta);
}

/** A pass nudges the topic rating down so the deck drifts towards easier problems. */
export function recordPass(topic: string): number {
  const current = ratingFor(parseRatings(readRatingsRaw()), topic);
  return write(topic, current - PASS_PENALTY);
}

type Rateable = { id: string; topic: string; elo: number };

/**
 * Serves the deck one card at a time: the closest problems to your rating in
 * each topic, cycling through the shortlist with `turn` so it isn't repetitive.
 */
export function pickCards<T extends Rateable>(
  cards: T[],
  ratings: Ratings,
  excluded: string[],
  turn: number,
  topics: readonly string[],
): { card: T | null; upcoming: T[] } {
  const gap = (entry: T) => Math.abs(entry.elo - ratingFor(ratings, entry.topic));
  const shortlist = cards
    .filter((entry) => topics.includes(entry.topic) && !excluded.includes(entry.id))
    .sort((a, b) => gap(a) - gap(b) || a.id.localeCompare(b.id))
    .slice(0, 5);

  if (shortlist.length === 0) return { card: null, upcoming: [] };
  const card = shortlist[turn % shortlist.length];
  return { card, upcoming: shortlist.filter((entry) => entry !== card).slice(0, 3) };
}

export { subscribeProgress };
