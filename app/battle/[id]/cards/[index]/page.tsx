import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AccountMenu from "@/components/AccountMenu";
import DuelProof from "@/components/DuelProof";
import { currentUser } from "@/lib/accounts";
import { cardFor } from "@/lib/duel";

export const dynamic = "force-dynamic";

export default async function DuelCardPage({
  params,
}: {
  params: Promise<{ id: string; index: string }>;
}) {
  const session = await currentUser();
  if (!session) redirect("/account");

  const { id, index } = await params;
  const card = await cardFor(id, Number(index), session.user.username);
  if (!card) notFound();

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

      <div className="mm-sheet">
        <h1>
          Card {card.index + 1} · {card.topic}
        </h1>
        <DuelProof initial={card} />
      </div>
    </main>
  );
}
