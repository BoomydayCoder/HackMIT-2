import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import FriendsPanel from "@/components/FriendsPanel";
import ProfileView from "@/components/ProfileView";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
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
        <ProfileView />
        <FriendsPanel />
      </div>
    </main>
  );
}
