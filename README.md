# MathMatch

A duelling app for math problems, built for HackMIT. Challenger cards show only
a topic, an Elo and a one-line taunt; swipe left to flee, swipe right to fight
and reveal the full problem, then write a proof and have it graded.

## How the arena works

- `data/harp-deck.json` holds a 100-problem pool sampled across HARP difficulty
  levels 1–9; each card's Elo comes from its stored HARP level and contest.
- You carry a separate Elo per topic (algebra, combinatorics, geometry, number
  theory), stored in the browser. A passing proof earns that topic's rating by
  how well it scored (5/5 the full gain, 4/5 half of it), fleeing a card nudges
  it down a little, and failing grades are free. Only the first outcome on a
  problem counts.
- Cards are served one at a time, closest to your rating in the topics you have
  selected in the top bar. Fighting is binding: the roster serves nothing else
  until you win the duel or take "Yield & view solution", which reveals the
  official solution and costs more rating than fleeing.
- Regenerate the pool with `python3 scripts/build_harp_deck.py 100 mixed`
  (`easy` and `proof` modes are also available).
- Every problem page has a five-star rating. Ratings are saved with the rest of
  your progress (and to your account when signed in), and steer the deck: the
  nearest candidates to your Elo are re-ranked by how similar they are to the
  problems you rated highly. Problem pages also list the closest problems in the
  same space under "If you like this one".

## Recommender

`lib/recommend.ts` scores problems against a taste vector: the review-weighted
sum of the vectors of problems you have rated, compared by cosine. A problem's
vector is a learned embedding from `data/problem-embeddings.json` when the file
has been trained, otherwise hand-made content features (topic, level, Elo and a
hashed bag of words of the statement). `ml/features.py` mirrors those features
exactly, so the deep model trains on the same inputs the browser uses.

The training pipeline in `ml/` is a two-tower model in PyTorch: an MLP problem
tower over the content features and a parameter-free user tower (label-weighted
sum of history embeddings), so exported problem embeddings drop straight into
the browser scorer without shipping a model. Labels come from star reviews
(explicit) and solves/surrenders (weaker implicit signals) in
`.data/accounts.json`.

```bash
pip install -r ml/requirements.txt
python3 -m ml.dataset                  # how much signal is there?
python3 -m ml.train --synthetic 60     # dry run padded with fake users
python3 -m ml.train                    # train on real accounts, export embeddings
```

`ml.train` holds out one interaction per user (leave-one-out), reports sign
accuracy and correlation against the untrained baseline, and writes
`data/problem-embeddings.json`, which the app picks up on the next build. Ship
the empty `{ "dim": 0, "problems": {} }` to fall back to content features.

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

Open http://localhost:3000/match.

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
