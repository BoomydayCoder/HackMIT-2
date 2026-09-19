import Link from "next/link";
import SwipeDeck from "@/components/SwipeDeck";
import { getDeck } from "@/lib/problems";

export default function MatchPage() {
  return (
    <main className="mm-page">
      <header className="mm-header">
        <Link className="mm-logo" href="/" aria-label="MathMatch home">
          <span className="mm-flame" aria-hidden="true">
            ♥
          </span>
          MathMatch
        </Link>
        <Link className="mm-nav" href="/problems">
          Library
        </Link>
      </header>

      <SwipeDeck cards={getDeck()} />

      <footer className="mm-footer">Problems from HARP (Yue et al., 2024)</footer>
    </main>
  );
}
