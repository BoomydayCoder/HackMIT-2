import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";

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
        <nav className="mm-header-links">
          <Link className="mm-nav" href="/problems">
            Library
          </Link>
          <AccountMenu className="mm-nav" />
        </nav>
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
