import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";

export const dynamic = "force-dynamic";

export default function BattlePage() {
  return (
    <main className="mm-page">
      <header className="mm-header">
        <Link className="mm-logo" href="/" aria-label="MathMatch home">
          <span className="mm-swords" aria-hidden="true">
            ⚔
          </span>
          MathMatch
        </Link>
        <AccountMenu className="mm-nav" />
      </header>

      <div className="mm-sheet mm-lists">
        <h1>The lists</h1>
        <p className="mm-bio">
          Ten cards, ratings hidden, fifteen minutes. Claim a card with a 4/5 sketch and it vanishes
          from your opponent&rsquo;s board; six cards wins the duel on the spot.
        </p>
        <p className="mm-count">
          The lists are still being raked — link with players from your{" "}
          <Link className="mm-nav" href="/profile">
            profile
          </Link>{" "}
          and you will be able to challenge them here.
        </p>
      </div>
    </main>
  );
}
