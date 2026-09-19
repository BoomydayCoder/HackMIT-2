import Link from "next/link";
import { PROBLEMS, SETS, type Problem } from "@/lib/problems";
import { getProfile } from "@/lib/profiles";

const topicOrder: string[] = [
  "algebra",
  "combinatorics",
  "geometry",
  "number theory",
];

const topicLetters: Record<string, string> = {
  algebra: "A",
  combinatorics: "C",
  geometry: "G",
  "number theory": "N",
};

function excerpt(statement: string) {
  const plain = statement.replace(/\s+/g, " ").trim();
  return plain.length > 140 ? `${plain.slice(0, 140)}…` : plain;
}

const setSubtitles: Record<Problem["set"], string> = {
  "AMC 8 2023":
    "Short answers aren't enough here — write a full justification, graded 0–7.",
  "IMO 2023 Shortlist":
    "Build a rigorous argument and get focused feedback on every step.",
};

function ProblemCard({ problem }: { problem: Problem }) {
  const meta =
    problem.set === "AMC 8 2023"
      ? `AMC 8 · #${problem.number}`
      : `Shortlist ${problem.number}`;
  const profile = getProfile(problem);

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
      <h3 className="card-name">
        {profile.name}
        <span
          className="card-age"
          title={`Estimated difficulty ${profile.difficulty}/10`}
        >
          {profile.difficulty}
        </span>
      </h3>
      <p className="card-tagline">{profile.tagline}</p>
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

      <div className="topic-groups">
        {SETS.map((set) => {
          const setProblems = PROBLEMS.filter((problem) => problem.set === set);
          return (
            <section className="set-group" key={set}>
              <div className="topic-heading">
                <h2>{set}</h2>
                <span className="topic-count">
                  {setProblems.length}{" "}
                  {setProblems.length === 1 ? "problem" : "problems"}
                </span>
              </div>
              <p className="set-subtitle">{setSubtitles[set]}</p>
              {set === "IMO 2023 Shortlist" ? (
                <div className="topic-groups">
                  {topicOrder.map((topic) => {
                    const problems = setProblems.filter(
                      (problem) => problem.topic === topic,
                    );
                    if (problems.length === 0) return null;

                    return (
                      <div className="topic-group" key={topic}>
                        <div className="topic-heading topic-heading-nested">
                          <span className="topic-letter">
                            {topicLetters[topic]}
                          </span>
                          <h3>{topic}</h3>
                          <span className="topic-count">
                            {problems.length}{" "}
                            {problems.length === 1 ? "problem" : "problems"}
                          </span>
                        </div>
                        <div className="problem-grid">
                          {problems.map((problem) => (
                            <ProblemCard key={problem.id} problem={problem} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="problem-grid">
                  {setProblems.map((problem) => (
                    <ProblemCard key={problem.id} problem={problem} />
                  ))}
                </div>
              )}
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
