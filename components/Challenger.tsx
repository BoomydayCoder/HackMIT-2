import Image from "next/image";
import { characterFor } from "@/lib/characters";

const TOPIC_GLYPHS: Record<string, string> = {
  algebra: "∑",
  combinatorics: "⚄",
  geometry: "△",
  "number theory": "ℤ",
};

type ChallengerProps = {
  id: string;
  topic: string;
  className?: string;
};

/** The opponent you are duelling: a topic character, or the topic glyph when none exists. */
export default function Challenger({ id, topic, className = "" }: ChallengerProps) {
  const character = characterFor(id, topic);
  if (!character) return <span className="mm-watermark">{TOPIC_GLYPHS[topic] ?? "∞"}</span>;
  return (
    <span className={`mm-portrait ${className}`.trim()}>
      <Image src={character.image} alt={character.alt} title={character.name} sizes="320px" />
    </span>
  );
}
