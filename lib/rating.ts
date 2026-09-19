import { notifyProgress, subscribeProgress } from "@/lib/lifelines";

export const TOPICS = ["algebra", "combinatorics", "geometry", "number theory"] as const;
export const STARTING_RATING = 1000;

const RATINGS_KEY = "mathmatch:ratings";
const PASS_PENALTY = 8;
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

/** A solve is worth a lot, and worth more the further the problem sits above you. */
export function recordSolve(topic: string, problemElo: number): number {
  const current = ratingFor(parseRatings(readRatingsRaw()), topic);
  const gain = Math.min(MAX_SOLVE_GAIN, Math.max(MIN_SOLVE_GAIN, 40 + (problemElo - current) / 6));
  return write(topic, current + gain);
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
): { card: T | null; upcoming: T[] } {
  const gap = (entry: T) => Math.abs(entry.elo - ratingFor(ratings, entry.topic));
  const shortlist = cards
    .filter((entry) => !excluded.includes(entry.id))
    .sort((a, b) => gap(a) - gap(b) || a.id.localeCompare(b.id))
    .slice(0, 5);

  if (shortlist.length === 0) return { card: null, upcoming: [] };
  const card = shortlist[turn % shortlist.length];
  return { card, upcoming: shortlist.filter((entry) => entry !== card).slice(0, 3) };
}

export { subscribeProgress };
