import Link from "next/link";
import { notFound } from "next/navigation";
import Math from "@/components/Math";
import ProofEditor from "@/components/ProofEditor";
import { getProblem } from "@/lib/problems";

type ProblemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { id } = await params;
  const problem = getProblem(id);

  if (!problem) notFound();

  return (
    <main className="page">
      <header className="header">
        <Link className="wordmark" href="/" aria-label="MathMatch home">
          Math<span>♥</span>Match
        </Link>
        <Link className="back-link" href="/match">
          Back to the deck
        </Link>
      </header>

      <div className="problem-header">
        <div className="eyebrow">
          {`${problem.set} · ${problem.topic}`}
        </div>
        <h1>Problem {problem.number}</h1>
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
        </article>
        <ProofEditor problemId={problem.id} solution={problem.solution} />
      </div>

      <footer className="footer">
        <span>MathMatch</span>
        <span>Problems from HARP (Yue et al., 2024)</span>
      </footer>
    </main>
  );
}
