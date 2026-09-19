"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useAccount } from "@/lib/account";

type AccountMenuProps = {
  /** Class for the link/button, so it matches whichever header it sits in. */
  className: string;
};

export default function AccountMenu({ className }: AccountMenuProps) {
  const account = useAccount();
  const [busy, setBusy] = useState(false);

  if (account === undefined) return <span className={className} aria-hidden="true" />;

  if (!account) {
    return (
      <Link className={className} href="/account">
        Sign in
      </Link>
    );
  }

  return (
    <span className="account-menu">
      <span className={className}>{account.username}</span>
      <button
        className={`${className} account-signout`}
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await signOut();
          } finally {
            setBusy(false);
          }
        }}
      >
        Sign out
      </button>
    </span>
  );
}
