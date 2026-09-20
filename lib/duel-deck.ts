import { bandOf, type DuelTier } from "@/lib/duel-tiers";
import { PROBLEMS, type Problem } from "@/lib/problems";

function take<T>(pool: T[], count: number): T[] {
  const picked: T[] = [];
  for (let index = 0; index < count && pool.length > 0; index += 1) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

/**
 * Deals a tier's deck around the two players' mean rating: each band is drawn
 * from problems within its span of the centre, widening to the whole band when
 * that window is too thin. Ratings stay on the server — the board shows only
 * the topic.
 */
export function dealCards(tier: DuelTier, centre: number): string[] {
  const chosen: Problem[] = [];
  const used = new Set<string>();

  for (const { band, count, span } of tier.mix) {
    const inBand = PROBLEMS.filter((problem) => bandOf(problem) === band && !used.has(problem.id));
    const near = inBand.filter((problem) => Math.abs(problem.elo - centre) <= span);
    const drawn = take(near.length >= count ? near : inBand, count);
    for (const problem of drawn) used.add(problem.id);
    chosen.push(...drawn);
  }

  return chosen.sort(() => Math.random() - 0.5).map((problem) => problem.id);
}
