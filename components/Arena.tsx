import arena from "@/data/wallpapers/hackmit-2026-arena.png";

/** The illustrated duelling ground every page is drawn on. */
export default function Arena() {
  return <div className="mm-arena" style={{ backgroundImage: `url(${arena.src})` }} aria-hidden="true" />;
}
