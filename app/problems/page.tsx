import Link from "next/link";
import { PROBLEMS, SETS, type Problem } from "@/lib/problems";

function excerpt(statement: string) {
  const plain = statement.replace(/\s+/g, " ").trim();
  return plain.length > 140 ? `${plain.slice(0, 140)}…` : plain;
}

function ProblemCard({ problem }: { problem: Problem }) {
  const meta = `${problem.set} · #${problem.number}`;

  return (
    <Link
      className="problem-card"
      href={`/problems/${problem.id}`}
      key={problem.id}
    >
      <div className="card-meta">
        <span>{meta}</span>
        <span>{problem.proposer}</span>
      </div>
      <h3>Problem {problem.number}</h3>
      <p>{excerpt(problem.statement)}</p>
      <span className="card-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

export default function ProblemsPage() {
  return (
    <main className="page">
      <header className="header">
        <Link className="wordmark" href="/" aria-label="rigor.ai home">
          rigor<span>.</span>ai
        </Link>
        <Link className="back-link" href="/">
          Back home
        </Link>
      </header>

      <section className="listing-intro">
        <div className="eyebrow">Problem library</div>
        <h1>Choose a problem.</h1>
        <p className="intro">
          Pick a problem, write the proof you believe in, and get a focused
          read from an AI grader trained on olympiad standards.
        </p>
      </section>

      {PROBLEMS.length === 0 ? (
        <p className="intro">No problem sets are loaded yet.</p>
      ) : (
        <div className="topic-groups">
          {SETS.map((set) => {
            const setProblems = PROBLEMS.filter(
              (problem) => problem.set === set,
            );
            return (
              <section className="set-group" key={set}>
                <div className="topic-heading">
                  <h2>{set}</h2>
                  <span className="topic-count">
                    {setProblems.length}{" "}
                    {setProblems.length === 1 ? "problem" : "problems"}
                  </span>
                </div>
                <div className="problem-grid">
                  {setProblems.map((problem) => (
                    <ProblemCard key={problem.id} problem={problem} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <footer className="footer">
        <span>rigor.ai</span>
        <span>Made for HackMIT</span>
      </footer>
    </main>
  );
}
