import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import SwipeDeck from "@/components/SwipeDeck";
import { getDeck } from "@/lib/problems";

export default function MatchPage() {
  return (
    <main className="mm-page mm-page-fit">
      <header className="mm-header">
        <Link className="mm-logo" href="/" aria-label="MathMatch home">
          <span className="mm-swords" aria-hidden="true">
            ⚔
          </span>
          MathMatch
        </Link>
        <nav className="mm-header-links">
          <Link className="mm-nav" href="/problems">
            Roster
          </Link>
          <AccountMenu className="mm-nav" />
        </nav>
      </header>

      <SwipeDeck cards={getDeck()} />

      <footer className="mm-footer">Problems from HARP (Yue et al., 2024)</footer>
    </main>
  );
}
