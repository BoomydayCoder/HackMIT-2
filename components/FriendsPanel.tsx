"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FriendState = "none" | "friends" | "sent" | "received";
type FriendLink = { username: string; state: FriendState };
type Payload = { friends?: FriendLink[]; matches?: string[]; error?: string };

const LABEL: Record<FriendState, string> = {
  friends: "Sworn",
  sent: "Awaiting their word",
  received: "Wants to link",
  none: "",
};

/** Search for players, ask to link, and see who has asked you. */
export default function FriendsPanel() {
  const [term, setTerm] = useState("");
  const [data, setData] = useState<Payload>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch(`/api/friends?q=${encodeURIComponent(term.trim())}`)
        .then((response) => response.json() as Promise<Payload>)
        .then(setData)
        .catch(() => setData({ error: "Could not reach the heralds." }));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [term]);

  async function link(username: string) {
    const response = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const next = (await response.json()) as Payload;
    setData((previous) => ({ ...previous, ...next }));
  }

  const friends = data.friends ?? [];
  const known = new Set(friends.map((friend) => friend.username.toLowerCase()));

  if (data.error) return <p className="mm-count">{data.error}</p>;

  return (
    <section className="mm-friends">
      <h2 className="control-label">Allies</h2>
      <input
        className="mm-search"
        value={term}
        placeholder="Search players by name…"
        onChange={(event) => setTerm(event.target.value)}
      />

      {data.matches?.length ? (
        <ul className="mm-friend-list">
          {data.matches.map((username) => (
            <li key={username}>
              <Link href={`/u/${username}`}>{username}</Link>
              {known.has(username.toLowerCase()) ? (
                <span className="mm-count">
                  {LABEL[friends.find((f) => f.username === username)?.state ?? "none"]}
                </span>
              ) : (
                <button type="button" onClick={() => void link(username)}>
                  Link
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="mm-friend-list">
        {friends.map((friend) => (
          <li key={friend.username}>
            <Link href={`/u/${friend.username}`}>{friend.username}</Link>
            {friend.state === "received" ? (
              <button type="button" onClick={() => void link(friend.username)}>
                Accept
              </button>
            ) : (
              <span className="mm-count">{LABEL[friend.state]}</span>
            )}
          </li>
        ))}
        {friends.length === 0 && <li className="mm-count">No allies yet — search for one above.</li>}
      </ul>
    </section>
  );
}
