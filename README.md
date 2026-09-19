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

The library also includes AMC 8 2023; regenerate its data with `python3 scripts/convert_amc8.py` using AoPS raw wikitext, an answer key, and per-problem pages as inputs.
