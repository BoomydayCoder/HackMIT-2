import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import SwipeDeck from "@/components/SwipeDeck";
import { getDeck } from "@/lib/problems";

export default function DeckPage() {
  return (
    <main className="mm-page">
      <header className="mm-header">
        <Link className="mm-logo" href="/" aria-label="MathMatch home">
          MathMatch
        </Link>
        <nav className="mm-header-links">
          <Link className="mm-nav" href="/problems">
            Library
          </Link>
          <AccountMenu className="mm-nav" />
        </nav>
      </header>

      <SwipeDeck cards={getDeck()} />

      <footer className="mm-footer">Problems from HARP (Yue et al., 2024)</footer>
    </main>
  );
}
