import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AccountMenu from "@/components/AccountMenu";
import DuelBoard from "@/components/DuelBoard";
import { currentUser } from "@/lib/accounts";
import { boardFor } from "@/lib/duel";

export const dynamic = "force-dynamic";

export default async function DuelPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await currentUser();
  if (!session) redirect("/account");

  const { id } = await params;
  const board = await boardFor(id, session.user.username);
  if (!board) notFound();

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

      <DuelBoard initial={board} />
    </main>
  );
}
