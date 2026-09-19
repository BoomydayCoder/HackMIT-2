# rigor.ai

The Next.js starter for rigor.ai, an Olympiad practice app built for HackMIT.

## Run locally

Install [Node.js 20.9 or later](https://nodejs.org/) and Git. The repository
uses pnpm 11 through Corepack. To run the current proof-grader branch:

```bash
git clone https://github.com/BoomydayCoder/HackMIT-2.git
cd HackMIT-2
git checkout devin/1789840437-imo-2023-proof-grader
corepack enable
pnpm install
cp .env.example .env.local
```

Open `.env.local` and set `OPENAI_API_KEY` to an OpenAI API key. Keep this file
private; it is gitignored and must not be committed. Then start the app:

```bash
pnpm dev
```

Open http://localhost:3000/problems. If the feature branch has been merged
into `main`, omit the `git checkout` command.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Grading

The proof grader sends a selected problem and a student's proof to the OpenAI Chat Completions API. Copy `.env.example` to a local environment file and set `OPENAI_API_KEY`; the model and rigor level are chosen in the UI, while `OPENAI_MODEL` sets the default model. The browser submits proofs to `POST /api/grade` with `{ "problemId": "...", "proof": "...", "rigor": 3, "model": "o4-mini" }`.

The AMC 8 2023 and IMO 2023 Shortlist sets have been removed; HARP is the only bundled problem source. `scripts/convert_amc8.py` and `scripts/extract_shortlist.py` remain if those sets are reinstated.

## HARP problem dataset

The repository includes 4,780 short-answer problems and 310 proof problems from **HARP**, by Albert S. Yue, Lovish Madaan, Ted Moskovitz, DJ Strouse, and Aaditya K. Singh (2024). See [data/harp](data/harp/README.md) for the source archives, attribution, MIT license, field descriptions, category counts, and integration notes. These source files are not yet wired into the app's problem loader.
