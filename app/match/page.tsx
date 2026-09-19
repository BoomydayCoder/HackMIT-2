import Link from "next/link";
import SwipeDeck from "@/components/SwipeDeck";
import { getDeck } from "@/lib/problems";

export default function MatchPage() {
  return (
    <main className="page">
      <header className="header">
        <Link className="wordmark" href="/" aria-label="MathMatch home">
          Math<span>·</span>Match
        </Link>
        <Link className="back-link" href="/problems">
          Library
        </Link>
      </header>

      <SwipeDeck cards={getDeck()} />

      <footer className="footer">
        <span>MathMatch</span>
        <span>Problems from HARP (Yue et al., 2024)</span>
      </footer>
    </main>
  );
}
