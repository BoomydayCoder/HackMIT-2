import Link from "next/link";
import { PROBLEMS, type ShortlistProblem } from "@/lib/problems";

const topicOrder: ShortlistProblem["topic"][] = [
  "algebra",
  "combinatorics",
  "geometry",
  "number theory",
];

const topicLetters: Record<ShortlistProblem["topic"], string> = {
  algebra: "A",
  combinatorics: "C",
  geometry: "G",
  "number theory": "N",
};

function excerpt(statement: string) {
  const plain = statement.replace(/\s+/g, " ").trim();
  return plain.length > 140 ? `${plain.slice(0, 140)}…` : plain;
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
        <div className="eyebrow">IMO 2023 shortlist</div>
        <h1>Choose a problem.</h1>
        <p className="intro">
          Pick a problem, write the proof you believe in, and get a focused
          read from an AI grader trained on olympiad standards.
        </p>
      </section>

      <div className="topic-groups">
        {topicOrder.map((topic) => {
          const problems = PROBLEMS.filter((problem) => problem.topic === topic);
          if (problems.length === 0) return null;

          return (
            <section className="topic-group" key={topic}>
              <div className="topic-heading">
                <span className="topic-letter">{topicLetters[topic]}</span>
                <h2>{topic}</h2>
                <span className="topic-count">
                  {problems.length} {problems.length === 1 ? "problem" : "problems"}
                </span>
              </div>
              <div className="problem-grid">
                {problems.map((problem) => (
                  <Link
                    className="problem-card"
                    href={`/problems/${problem.id}`}
                    key={problem.id}
                  >
                    <div className="card-meta">
                      <span>Shortlist {problem.number}</span>
                      <span>{problem.proposer}</span>
                    </div>
                    <h3>Problem {problem.number}</h3>
                    <p>{excerpt(problem.statement)}</p>
                    <span className="card-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="footer">
        <span>rigor.ai</span>
        <span>Made for HackMIT</span>
      </footer>
    </main>
  );
}
