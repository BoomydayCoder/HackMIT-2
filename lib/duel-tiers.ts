import type { Problem } from "@/lib/problems";

/**
 * The three shapes a duel can take. Each one fixes its own clock, deck size,
 * win condition and difficulty mix, so a five-minute skirmish over AMC 8
 * warm-ups and a ninety-minute olympiad boss fight share the same engine.
 */
export type DuelTierId = "skirmish" | "duel" | "boss";

/** Which contest family a problem belongs to, for dealing a deck by difficulty. */
export type Band = "junior" | "senior" | "aime" | "olympiad";

export function bandOf(problem: Problem): Band {
  if (/USA[JM]MO/.test(problem.set)) return "olympiad";
  if (/AIME/.test(problem.set)) return "aime";
  return /AJHSME|AMC 8|AMC 10/.test(problem.set) ? "junior" : "senior";
}

export type DuelTier = {
  id: DuelTierId;
  name: string;
  blurb: string;
  minutes: number;
  cards: number;
  /** Claims that end the duel on the spot; always more than half the deck. */
  toWin: number;
  /** Cards drawn from each band, and how far from the players' rating to look. */
  mix: { band: Band; count: number; span: number }[];
};

export const DUEL_TIERS: readonly DuelTier[] = [
  {
    id: "skirmish",
    name: "Skirmish",
    blurb: "Five minutes, mostly AMC 8–10. First to four.",
    minutes: 5,
    cards: 6,
    toWin: 4,
    mix: [
      { band: "junior", count: 5, span: 400 },
      { band: "senior", count: 1, span: 400 },
    ],
  },
  {
    id: "duel",
    name: "Duel",
    blurb: "Fifteen minutes, a few AIME and one olympiad. First to six.",
    minutes: 15,
    cards: 10,
    toWin: 6,
    mix: [
      { band: "junior", count: 4, span: 350 },
      { band: "senior", count: 3, span: 350 },
      { band: "aime", count: 2, span: 500 },
      { band: "olympiad", count: 1, span: Infinity },
    ],
  },
  {
    id: "boss",
    name: "Boss battle",
    blurb: "Ninety minutes of olympiad proofs. First to three.",
    minutes: 90,
    cards: 4,
    toWin: 3,
    mix: [{ band: "olympiad", count: 4, span: Infinity }],
  },
];

export const DEFAULT_TIER: DuelTierId = "duel";

export function tierOf(id: string | null | undefined): DuelTier {
  return DUEL_TIERS.find((tier) => tier.id === id) ?? DUEL_TIERS[1];
}

