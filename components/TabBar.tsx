"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Archery butt with an arrow struck in it. */
function TargetIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="15" cy="17" r="10" />
      <circle cx="15" cy="17" r="6" />
      <circle cx="15" cy="17" r="2" fill="currentColor" stroke="none" />
      <path d="M15 17 29 4" />
      <path d="M24 4h5v5" />
    </svg>
  );
}

/** Two crossed swords. */
function SwordsIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5 4h4l16 18-3 3L4 9V4z" />
      <path d="M27 4h-4L7 22l3 3L28 9V4z" />
      <path d="M20 22l4 4M12 22l-4 4" />
    </svg>
  );
}

/** A knight's great helm. */
function HelmIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 12a9 9 0 0 1 18 0v10a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6V12z" />
      <path d="M7 14h18" />
      <path d="M7 19h18" />
      <path d="M16 14v5" />
      <path d="M16 3v-2" />
    </svg>
  );
}

const TABS = [
  { href: "/match", label: "Training", Icon: TargetIcon },
  { href: "/battle", label: "Battle", Icon: SwordsIcon },
  { href: "/profile", label: "Profile", Icon: HelmIcon },
];

/** The three halls of the keep, pinned to the foot of every page. */
export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="mm-tabs" aria-label="Sections">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            className={`mm-tab${active ? " mm-tab-on" : ""}`}
            href={href}
            aria-current={active ? "page" : undefined}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
