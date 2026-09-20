"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DEFAULT_TIER, DUEL_TIERS, type DuelTierId } from "@/lib/duel-tiers";

type Invite = {
  id: string;
  status: "pending" | "active";
  them: string;
  incoming: boolean;
  tier: string;
};
type FriendLink = { username: string; state: string };

/** Challenge an ally, answer a challenge, or walk back into a running duel. */
export default function BattleLobby() {
  const router = useRouter();
  const [duels, setDuels] = useState<Invite[]>([]);
  const [allies, setAllies] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [tier, setTier] = useState<DuelTierId>(DEFAULT_TIER);

  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const [duelResponse, friendResponse] = await Promise.all([
          fetch("/api/duel"),
          fetch("/api/friends"),
        ]);
        if (duelResponse.status === 401) {
          if (live) setError("Sign in to enter the lists.");
          return;
        }
        const duelData = (await duelResponse.json()) as { duels?: Invite[] };
        const friendData = (await friendResponse.json()) as { friends?: FriendLink[] };
        if (!live) return;
        setDuels(duelData.duels ?? []);
        setAllies(
          (friendData.friends ?? [])
            .filter((friend) => friend.state === "friends")
            .map((friend) => friend.username),
        );
      } catch {
        if (live) setError("Could not reach the heralds.");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 3000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);

  async function challenge(username: string) {
    setBusy(username);
    const response = await fetch("/api/duel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, tier }),
    });
    const data = (await response.json()) as { duels?: Invite[]; error?: string };
    setBusy("");
    if (data.error) setError(data.error);
    else setDuels(data.duels ?? []);
  }

  async function answer(id: string, action: "accept" | "decline") {
    setBusy(id);
    const response = await fetch(`/api/duel/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy("");
    if (data.error) {
      setError(data.error);
      return;
    }
    if (action === "accept") router.push(`/battle/${id}`);
    else setDuels((previous) => previous.filter((duel) => duel.id !== id));
  }

  const challenged = new Set(duels.map((duel) => duel.them.toLowerCase()));

  return (
    <>
      {error && <p className="mm-count">{error}</p>}

      {duels.length > 0 && (
        <section className="mm-friends">
          <h2 className="control-label">Challenges</h2>
          <ul className="mm-friend-list">
            {duels.map((duel) => (
              <li key={duel.id}>
                <span>
                  {duel.status === "active" ? "Duel underway with " : null}
                  <strong>{duel.them}</strong>
                  {duel.status === "pending"
                    ? duel.incoming
                      ? " challenges you"
                      : " has not answered yet"
                    : null}
                  <span className="mm-tier-tag">{duel.tier}</span>
                </span>
                <span className="mm-duel-actions">
                  {duel.status === "active" ? (
                    <button type="button" onClick={() => router.push(`/battle/${duel.id}`)}>
                      Enter the lists
                    </button>
                  ) : duel.incoming ? (
                    <>
                      <button
                        type="button"
                        disabled={busy === duel.id}
                        onClick={() => void answer(duel.id, "accept")}
                      >
                        Accept
                      </button>
                      <button type="button" onClick={() => void answer(duel.id, "decline")}>
                        Decline
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => void answer(duel.id, "decline")}>
                      Withdraw
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mm-friends">
        <h2 className="control-label">Form of combat</h2>
        <ul className="mm-tier-list">
          {DUEL_TIERS.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className={`mm-tier${option.id === tier ? " is-chosen" : ""}`}
                aria-pressed={option.id === tier}
                onClick={() => setTier(option.id)}
              >
                <strong>{option.name}</strong>
                <span>{option.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mm-friends">
        <h2 className="control-label">Allies</h2>
        <ul className="mm-friend-list">
          {allies.map((ally) => (
            <li key={ally}>
              <span>{ally}</span>
              {challenged.has(ally.toLowerCase()) ? (
                <span className="mm-count">Already summoned</span>
              ) : (
                <button
                  type="button"
                  disabled={busy === ally}
                  onClick={() => void challenge(ally)}
                >
                  Challenge
                </button>
              )}
            </li>
          ))}
          {allies.length === 0 && (
            <li className="mm-count">
              No allies yet — link with players from your profile to challenge them.
            </li>
          )}
        </ul>
      </section>
    </>
  );
}
