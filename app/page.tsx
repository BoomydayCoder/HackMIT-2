import Link from "next/link";

export default function Home() {
  return (
    <main className="mm-page mm-landing">
      <header className="mm-header">
        <span className="mm-logo">
          <span className="mm-flame" aria-hidden="true">
            ♥
          </span>
          MathMatch
        </span>
        <Link className="mm-nav" href="/problems">
          Library
        </Link>
      </header>

      <section className="mm-hero">
        <h1>Swipe right on your next proof.</h1>
        <p>
          Olympiad problems as cards. Pass on the ones that don&apos;t fit, match
          the ones that do, and write the proof.
        </p>
        <Link className="mm-btn mm-btn-primary mm-cta" href="/match">
          Start matching
        </Link>
      </section>

      <footer className="mm-footer">Problems from HARP (Yue et al., 2024)</footer>
    </main>
  );
}
