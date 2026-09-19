"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signUp, useAccount } from "@/lib/account";

type Mode = "signin" | "signup";

export default function AuthForm() {
  const router = useRouter();
  const account = useAccount();
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") await signUp(username.trim(), password);
      else await signIn(username.trim(), password);
      router.push("/deck");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (account) {
    return (
      <section className="mm-auth">
        <h1>Hi, {account.username}.</h1>
        <p>Your picks, solves and ratings are saved to this account.</p>
        <button className="mm-btn mm-btn-primary" type="button" onClick={() => router.push("/deck")}>
          Back to the deck
        </button>
      </section>
    );
  }

  return (
    <section className="mm-auth">
      <div className="mm-auth-tabs" role="tablist">
        {(["signin", "signup"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={mode === option}
            className={`mm-rating${mode === option ? " mm-rating-on" : ""}`}
            onClick={() => {
              setMode(option);
              setError("");
            }}
          >
            {option === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <h1>{mode === "signin" ? "Welcome back." : "Save your progress."}</h1>
      <p>
        {mode === "signin"
          ? "Pick up your deck, solves and ratings on any device."
          : "Anything you've already done in this browser comes with you."}
      </p>

      <form className="mm-auth-form" onSubmit={submit}>
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z0-9_]+"
            title="Letters, digits and underscores"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>
        {error && <p className="mm-auth-error" role="alert">{error}</p>}
        <button className="mm-btn mm-btn-primary" type="submit" disabled={busy}>
          {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </section>
  );
}
