import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function AccountPage() {
  return (
    <main className="mm-page">
      <header className="mm-header">
        <Link className="mm-logo" href="/" aria-label="MathMatch home">
          MathMatch
        </Link>
        <Link className="mm-nav" href="/deck">
          Back to the deck
        </Link>
      </header>

      <AuthForm />

      <footer className="mm-footer">Problems from HARP (Yue et al., 2024)</footer>
    </main>
  );
}
