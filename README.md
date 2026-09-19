# rigor.ai

The Next.js starter for rigor.ai, an Olympiad practice app built for HackMIT.

## Run locally

Install Node.js 20.9 or later and pnpm 11. Then:

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Grading

The proof grader sends a selected shortlist problem and a student's proof to the OpenAI Chat Completions API. Copy `.env.example` to a local environment file and set `OPENAI_API_KEY`; `OPENAI_MODEL` defaults to `gpt-4o-mini`. The browser submits proofs to `POST /api/grade` with `{ "problemId": "...", "proof": "..." }`.
