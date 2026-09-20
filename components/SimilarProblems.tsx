import Link from "next/link";
import type { DeckCard } from "@/lib/problems";
import { getProfile } from "@/lib/profiles";
import { similarProblems } from "@/lib/recommend";

type SimilarProblemsProps = {
  pool: DeckCard[];
  target: DeckCard;
  limit?: number;
};

/** Nearest neighbours of a problem in the recommender's vector space. */
export default function SimilarProblems({ pool, target, limit = 3 }: SimilarProblemsProps) {
  const neighbours = similarProblems(pool, target, limit);
  if (neighbours.length === 0) return null;

  return (
    <section className="similar-problems">
      <div className="card-label">If you like this one</div>
      <ul>
        {neighbours.map((problem) => (
          <li key={problem.id}>
            <Link href={`/problems/${problem.id}`}>
              <strong>{getProfile(problem).name}</strong>
              <span>
                {problem.topic} · Level {problem.level} · Elo {problem.elo}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
