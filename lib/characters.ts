import type { StaticImageData } from "next/image";

import sumCollector from "@/data/characters/algebra/01-sum-collector.png";
import integralSnatcher from "@/data/characters/algebra/02-integral-snatcher.png";
import rootWraith from "@/data/characters/algebra/03-root-wraith.png";
import matrixMarshal from "@/data/characters/algebra/04-matrix-marshal.png";
import polynomialPuppeteer from "@/data/characters/algebra/05-polynomial-puppeteer.png";
import pigeonholeWarden from "@/data/characters/combinatorics/01-pigeonhole-warden.png";
import permutationCommittee from "@/data/characters/combinatorics/02-permutation-committee.png";
import combinationChooser from "@/data/characters/combinatorics/03-combination-chooser.png";
import latticePathCourier from "@/data/characters/combinatorics/04-lattice-path-courier.png";
import inclusionExclusionInspectors from "@/data/characters/combinatorics/05-inclusion-exclusion-inspectors.png";
import compassDuellist from "@/data/characters/geometry/compass-duellist.png";
import dividerDuellist from "@/data/characters/geometry/divider-duellist.png";
import protractorCrab from "@/data/characters/geometry/protractor-crab.png";
import rulerSwordsman from "@/data/characters/geometry/ruler-swordsman.png";
import setSquareSentinel from "@/data/characters/geometry/set-square-sentinel.png";
import primeFactorLocksmith from "@/data/characters/number-theory/01-prime-factor-locksmith.png";
import modularClockkeeper from "@/data/characters/number-theory/02-modular-clockkeeper.png";
import euclideanMeasurer from "@/data/characters/number-theory/03-euclidean-measurer.png";
import remainderMaster from "@/data/characters/number-theory/04-remainder-master.png";
import fermatKnight from "@/data/characters/number-theory/05-fermat-knight.png";

export type Character = {
  name: string;
  alt: string;
  image: StaticImageData;
};

/** The duel portraits from data/characters, grouped by the topic they belong to. */
const CHARACTERS: Record<string, Character[]> = {
  algebra: [
    { name: "The Sum Collector", alt: "Masked trickster carrying a summation-symbol staff.", image: sumCollector },
    { name: "The Integral Snatcher", alt: "Purple trickster with integral staff and dx tag.", image: integralSnatcher },
    { name: "The Root Wraith", alt: "Hunched figure with radical hat and square-power pendant.", image: rootWraith },
    {
      name: "The Matrix Marshal",
      alt: "Broad masked figure with bracket shoulders and a two-by-two shield.",
      image: matrixMarshal,
    },
    {
      name: "The Polynomial Puppeteer",
      alt: "Trickster controlling three variable puppets.",
      image: polynomialPuppeteer,
    },
  ],
  combinatorics: [
    {
      name: "The Pigeonhole Warden",
      alt: "Chief pigeon with four pigeons crowded into three compartments.",
      image: pigeonholeWarden,
    },
    {
      name: "The Permutation Committee",
      alt: "Three pigeons exchange labelled hats inside a trench coat.",
      image: permutationCommittee,
    },
    {
      name: "The Combination Chooser",
      alt: "Pigeon selects a pair of coloured tokens.",
      image: combinationChooser,
    },
    {
      name: "The Lattice Path Courier",
      alt: "Pigeon courier wearing a grid-route cape.",
      image: latticePathCourier,
    },
    {
      name: "The Inclusion\u2013Exclusion Inspectors",
      alt: "Two pigeon clerks carry overlapping nets with a shared token.",
      image: inclusionExclusionInspectors,
    },
  ],
  geometry: [
    {
      name: "The Compass Duellist",
      alt: "Compass-legged surveyor with a red cape and set-square shield.",
      image: compassDuellist,
    },
    {
      name: "The Divider Duellist",
      alt: "Twin-point drafting instrument with a small moustache and red cape.",
      image: dividerDuellist,
    },
    { name: "The Protractor Crab", alt: "Crab rival with a semicircular measuring shell.", image: protractorCrab },
    {
      name: "The Ruler Swordsman",
      alt: "Lanky ruler duellist with oversized boots and pencil rapier.",
      image: rulerSwordsman,
    },
    { name: "The Set-Square Sentinel", alt: "Triangular sentinel with a pencil spear.", image: setSquareSentinel },
  ],
  "number theory": [
    {
      name: "The Prime Factor Locksmith",
      alt: "Beetle with a 30 shell and keys 2, 3, and 5.",
      image: primeFactorLocksmith,
    },
    {
      name: "The Modular Clockkeeper",
      alt: "Beetle with a cyclic wheel of residues 0 through 4.",
      image: modularClockkeeper,
    },
    { name: "The Euclidean Measurer", alt: "Beetle with rectangular tiles and measuring keys.", image: euclideanMeasurer },
    {
      name: "The Remainder Master",
      alt: "Beetle with locks labelled 3, 5, and 7 and a master key.",
      image: remainderMaster,
    },
    {
      name: "The Fermat Knight",
      alt: "Beetle knight with the example 2^4 congruent to 1 modulo 5.",
      image: fermatKnight,
    },
  ],
};

export type AvatarChoice = Character & { key: string; topic: string };

/** Every portrait, keyed so a player can wear one as their profile picture. */
export function avatarChoices(): AvatarChoice[] {
  return Object.entries(CHARACTERS).flatMap(([topic, roster]) =>
    roster.map((character, index) => ({ ...character, topic, key: `${topic}/${index}` })),
  );
}

export function avatarFor(key: string): AvatarChoice | null {
  return avatarChoices().find((choice) => choice.key === key) ?? null;
}

/** Picks one of the topic's characters at random, but stably: a problem keeps its opponent. */
export function characterFor(problemId: string, topic: string): Character | null {
  const roster = CHARACTERS[topic];
  if (!roster?.length) return null;
  let hash = 0;
  for (const code of problemId) hash = (hash * 31 + code.charCodeAt(0)) >>> 0;
  return roster[hash % roster.length];
}
