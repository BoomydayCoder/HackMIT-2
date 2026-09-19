import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";

export default function Home() {
  return (
    <main className="mm-page mm-landing">
      <header className="mm-header">
        <span className="mm-logo">
          <span className="mm-swords" aria-hidden="true">
            ⚔
          </span>
          MathMatch
        </span>
        <nav className="mm-header-links">
          <Link className="mm-nav" href="/problems">
            Roster
          </Link>
          <AccountMenu className="mm-nav" />
        </nav>
      </header>

      <section className="mm-hero">
        <h1>Pick your next duel.</h1>
        <p>
          Olympiad problems as challengers. Flee the ones you can&apos;t take,
          fight the ones you can, and win on the proof.
        </p>
        <Link className="mm-btn mm-btn-primary mm-cta" href="/match">
          Enter the arena
        </Link>
      </section>

      <footer className="mm-footer">Problems from HARP (Yue et al., 2024)</footer>
    </main>
  );
}
