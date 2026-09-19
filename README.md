# MathMatch

A card-deck problem picker for competition math, built for HackMIT. Cards show
only a topic, an Elo and a one-line blurb; swipe left to skip, swipe right to
pick the problem and reveal the full statement, then write a proof and have it
graded.

## How the deck works

- `data/harp-deck.json` holds a 100-problem pool sampled across HARP difficulty
  levels 1–9; each card's Elo comes from its stored HARP level and contest.
- You carry a separate Elo per topic (algebra, combinatorics, geometry, number
  theory), stored in the browser. A graded proof moves that topic's rating by
  how well it scored — 5/5 earns the full gain, 3/5 is par, below that costs
  you — and skipping a card nudges it down a little. Only the first grading
  of a problem counts.
- Cards are served one at a time, closest to your rating in the topics you have
  selected in the top bar. A problem you picked but have not solved stays at the
  front of the deck until you solve it or skip it.
- Regenerate the pool with `python3 scripts/build_harp_deck.py 100 mixed`
  (`easy` and `proof` modes are also available).

## Run locally

Install [Node.js 20.9 or later](https://nodejs.org/) and Git. The repository
uses pnpm 11 through Corepack.

```bash
git clone https://github.com/BoomydayCoder/HackMIT-2.git
cd HackMIT-2
corepack enable
pnpm install
cp .env.example .env.local
```

Open `.env.local` and set `OPENAI_API_KEY` to an OpenAI API key, and
`DEEPGRAM_API_KEY` to a Deepgram key if you want to dictate proofs. Keep this
file private; it is gitignored and must not be committed. Then start the app:

```bash
pnpm dev
```

Open http://localhost:3000/deck.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Grading

The proof grader sends a selected problem and a student's proof to the OpenAI Chat Completions API, and only on an explicit submission. The model and rigor level are chosen in the UI; `gpt-4o-mini` is the default and `OPENAI_MODEL` overrides it. The browser submits proofs to `POST /api/grade` with `{ "problemId": "...", "proof": "...", "rigor": 3, "model": "gpt-4o-mini" }`, and proofs are scored out of 5, with 4 or better counting as solved.

## Dictation

The proof editor can take spoken proofs. The mic button records in the browser
and posts the clip to `POST /api/transcribe`, which forwards it to Deepgram's
`nova-3` model and returns the text to append to the proof box, so
`DEEPGRAM_API_KEY` never leaves the server. Spoken mathematics transcribes
loosely, so read the text back before grading. Without the key the rest of the
app is unaffected and the mic button reports that dictation is unavailable.

The AMC 8 2023 and IMO 2023 Shortlist sets have been removed; HARP is the only bundled problem source. `scripts/convert_amc8.py` and `scripts/extract_shortlist.py` remain if those sets are reinstated.

## HARP problem dataset

The repository includes 4,780 short-answer problems and 310 proof problems from **HARP**, by Albert S. Yue, Lovish Madaan, Ted Moskovitz, DJ Strouse, and Aaditya K. Singh (2024). See [data/harp](data/harp/README.md) for the source archives, attribution, MIT license, field descriptions, category counts, and integration notes. `scripts/build_harp_deck.py` samples the app's deck from these archives.
