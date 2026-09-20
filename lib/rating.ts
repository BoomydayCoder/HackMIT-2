import { MAX_SCORE, PASS_SCORE } from "@/lib/grader";
import { notifyProgress, RATINGS_KEY, type Reviews, subscribeProgress } from "@/lib/progress";
import { affinity, tasteProfile } from "@/lib/recommend";

export const TOPICS = ["algebra", "combinatorics", "geometry", "number theory"] as const;
export const STARTING_RATING = 1000;

const PASS_PENALTY = 8;
const GIVE_UP_PENALTY = 40;
const MIN_SOLVE_GAIN = 20;
const MAX_SOLVE_GAIN = 90;

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
 * A passing proof earns rating in proportion to its score — the gain itself is
 * larger the further the problem sits above you. Failing grades are free, so a
 * match can be reattempted until it passes or is given up on.
 */
export function recordSolve(topic: string, problemElo: number, score: number): number {
  const current = ratingFor(parseRatings(readRatingsRaw()), topic);
  const marks = Math.min(MAX_SCORE, Math.max(PASS_SCORE, score));
  const gain = Math.min(MAX_SOLVE_GAIN, Math.max(MIN_SOLVE_GAIN, 40 + (problemElo - current) / 6));
  const share = (marks - PASS_SCORE + 1) / (MAX_SCORE - PASS_SCORE + 1);
  return write(topic, current + gain * share);
}

/** A pass nudges the topic rating down so the deck drifts towards easier problems. */
export function recordPass(topic: string): number {
  const current = ratingFor(parseRatings(readRatingsRaw()), topic);
  return write(topic, current - PASS_PENALTY);
}

/** Surrendering a match costs far more than declining it in the first place. */
export function recordGiveUp(topic: string): number {
  const current = ratingFor(parseRatings(readRatingsRaw()), topic);
  return write(topic, current - GIVE_UP_PENALTY);
}

type Rateable = {
  id: string;
  topic: string;
  elo: number;
  level: number;
  statement: string;
  keyIdeas: readonly string[];
};

const SHORTLIST = 5;
const CANDIDATES = 12;
/** How many rating points of Elo gap one full unit of taste affinity is worth. */
const TASTE_WEIGHT = 150;

/**
 * Serves the deck one card at a time: the closest problems to your rating in
 * each topic, cycling through the shortlist with `turn` so it isn't repetitive.
 * Once you have reviewed problems, the nearest candidates are re-ranked so the
 * ones most like what you liked come first.
 */
export function pickCards<T extends Rateable>(
  cards: T[],
  ratings: Ratings,
  excluded: string[],
  turn: number,
  topics: readonly string[],
  reviews: Reviews = {},
): { card: T | null; upcoming: T[] } {
  const gap = (entry: T) => Math.abs(entry.elo - ratingFor(ratings, entry.topic));
  const taste = tasteProfile(cards, reviews);
  const score = (entry: T) => gap(entry) - TASTE_WEIGHT * affinity(entry, taste);
  const shortlist = cards
    .filter((entry) => topics.includes(entry.topic) && !excluded.includes(entry.id))
    .sort((a, b) => gap(a) - gap(b) || a.id.localeCompare(b.id))
    .slice(0, taste ? CANDIDATES : SHORTLIST)
    .sort((a, b) => score(a) - score(b) || a.id.localeCompare(b.id))
    .slice(0, SHORTLIST);

  if (shortlist.length === 0) return { card: null, upcoming: [] };
  const card = shortlist[turn % shortlist.length];
  return { card, upcoming: shortlist.filter((entry) => entry !== card).slice(0, 3) };
}

export { subscribeProgress };
