import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <header className="header">
        <Link className="wordmark" href="/" aria-label="rigor.ai home">
          rigor<span>.</span>ai
        </Link>
        <span className="header-note">Built for serious practice</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="eyebrow">Olympiad training, with direction</div>
        <h1 id="hero-title">Put your reasoning to work.</h1>
        <p className="intro">
          A place to practice, reflect, and grow with a community of problem solvers.
        </p>
        <div className="hero-actions">
          <Link className="cta-link" href="/problems">
            Browse the problem library{" "}
            <span aria-hidden="true">→</span>
          </Link>
          <div className="status">The first version is taking shape.</div>
        </div>
      </section>

      <footer className="footer">
        <span>rigor.ai</span>
        <span>Made for HackMIT</span>
      </footer>
    </main>
  );
}
