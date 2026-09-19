import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import Challenger from "@/components/Challenger";
import { notFound } from "next/navigation";
import Math from "@/components/Math";
import ForYou from "@/components/ForYou";
import ProofEditor from "@/components/ProofEditor";
import SimilarProblems from "@/components/SimilarProblems";
import StarRating from "@/components/StarRating";
import { getDeck, getProblem } from "@/lib/problems";
import { getProfile } from "@/lib/profiles";

type ProblemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { id } = await params;
  const problem = getProblem(id);

  if (!problem) notFound();
  const profile = getProfile(problem);
  const deck = getDeck();
  const card = deck.find((entry) => entry.id === problem.id) ?? deck[0];

  return (
    <main className="page">
      <header className="header">
        <Link className="wordmark" href="/" aria-label="MathMatch home">
          Math<span>⚔</span>Match
        </Link>
        <nav className="header-links">
          <span className="back-link">Win the duel or yield to leave</span>
          <AccountMenu className="back-link" />
        </nav>
      </header>

      <div className="problem-header duel-header">
        <Challenger id={problem.id} topic={problem.topic} className="mm-portrait-duel" />
        <div className="eyebrow">
          {`${problem.set} · Problem ${problem.number} · ${problem.topic}`}
        </div>
        <h1>{profile.name}</h1>
        <a
          className="source-link"
          href={problem.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Source ↗
        </a>
      </div>

      <div className="workspace">
        <article className="statement-card">
          <div className="card-label">The problem</div>
          <div className="statement-copy">
            <Math text={problem.statement} />
          </div>
          <StarRating problemId={problem.id} />
          <SimilarProblems pool={deck} target={card} />
          <ForYou pool={deck} />
        </article>
        <ProofEditor
          problemId={problem.id}
          topic={problem.topic}
          elo={problem.elo}
          solution={problem.solution}
        />
      </div>

      <footer className="footer">
        <span>MathMatch</span>
        <span>Problems from HARP (Yue et al., 2024)</span>
      </footer>
    </main>
  );
}
