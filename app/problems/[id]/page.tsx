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
        <Link className="wordmark" href="/" aria-label="rigor.ai home">
          rigor<span>.</span>ai
        </Link>
        <Link className="back-link" href="/problems">
          All problems
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
        <span>rigor.ai</span>
        <span>Made for HackMIT</span>
      </footer>
    </main>
  );
}
