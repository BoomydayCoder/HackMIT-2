import { STARTING_RATING, TOPICS } from "@/lib/rating";

/** Claim this many cards and the duel ends on the spot. */
export const CARDS_TO_WIN = 6;

/** A duel swings a rating about twice as hard as a training solve. */
export const DUEL_K = 48;
/** No single duel can move one school of arms further than this. */
export const TOPIC_CAP = 60;

export const overallOf = (ratings: Record<string, number>): number =>
  Math.round(
    TOPICS.reduce((sum, topic) => sum + (ratings[topic] ?? STARTING_RATING), 0) / TOPICS.length,
  );

/**
 * One pairwise Elo update on the mean rating, scaled by the margin so a 6–0
 * is worth half again as much as a 4–3.
 */
export function duelDelta(mine: number, theirs: number, yours: number, opponent: number): number {
  const expected = 1 / (1 + 10 ** ((theirs - mine) / 400));
  const actual = yours === opponent ? 0.5 : yours > opponent ? 1 : 0;
  const margin = Math.abs(yours - opponent);
  const scale = margin <= 1 ? 1 : 1 + (0.5 * (margin - 1)) / (CARDS_TO_WIN - 1);
  return Math.round(DUEL_K * scale * (actual - expected));
}

/**
 * Spreads a duel's rating change over the topics the player actually fought
 * in — claimed cards for what you won, attempted-and-lost cards for what you
 * dropped — so a duel sharpens the profile you played rather than smearing
 * one number across four bars. Cards neither player opened move nothing.
 */
export function spreadDelta(
  delta: number,
  claimed: readonly string[],
  attempted: readonly string[],
): Record<string, number> {
  const pool = delta >= 0 ? [claimed, attempted] : [attempted, claimed];
  const topics = pool.find((list) => list.length > 0) ?? TOPICS;

  const weights = new Map<string, number>();
  for (const topic of topics) weights.set(topic, (weights.get(topic) ?? 0) + 1);
  const total = [...weights.values()].reduce((sum, count) => sum + count, 0);

  const spread: Record<string, number> = {};
  for (const [topic, count] of weights) {
    const share = Math.round((delta * count) / total);
    spread[topic] = Math.max(-TOPIC_CAP, Math.min(TOPIC_CAP, share));
  }
  return spread;
}

export function applySpread(
  ratings: Record<string, number>,
  spread: Record<string, number>,
): Record<string, number> {
  const next = { ...ratings };
  for (const [topic, change] of Object.entries(spread)) {
    next[topic] = Math.max(100, (next[topic] ?? STARTING_RATING) + change);
  }
  return next;
}
