# MathMatch — implementation brief for Devin

## 1. Start here

Build MathMatch in this repository by adapting the existing Next.js application. MathMatch helps students discover mathematical problems they want to attempt, submit written reasoning for AI feedback, and receive increasingly relevant recommendations.

The central demo loop is:

**Discover a problem → swipe right → write a proof → receive feedback → revise → receive a better next match.**

Read the current branch and any repository instructions before editing. This brief was written after inspecting main on September 19, 2026. Other contributors may have made further changes. Preserve their work and implement on a feature branch with a reviewable pull request.

This document is an implementation handoff. Its creation does not imply that the features below have already been implemented or tested.

## 2. Confirmed direction and proposed defaults

### Confirmed by the project owner

- The product is now called **MathMatch**, replacing rigor.ai.
- It uses a card-deck interface featuring math problems.
- Swiping left skips a problem; swiping right opens a place to enter a proof.
- AI grades the submitted proof.
- Recommendations should adapt to the user's difficulty level and preferences.
- The application lives in BoomydayCoder/HackMIT-2 and uses Next.js.

### Proposed implementation defaults

These are practical starting choices from the planning discussion, not separately approved requirements. Use them to make progress and surface meaningful tradeoffs in the PR.

- Label left swipe **Skip** and right swipe **Try this**. A skip is not automatically a failure.
- The product is about matching people with problems. Do not build any dating-style framing, profiles, or messaging between strangers.
- Begin with a curated subset of the existing data, with roughly 30–50 checked problems as a content target. A smaller verified set is acceptable for the first complete demo.
- Use written text with LaTeX for the first editor. Handwriting recognition can follow later.
- Use one consistent grading standard for adaptation. Keep existing model and rigor controls available only as advanced controls if retained.
- Use transparent rules for recommendations first. A trained recommender is not needed for the hackathon.
- Deliver a functioning local demo first, then persistent accounts if time and credentials permit.

## 3. Existing code to reuse

The repository has progressed beyond the original starter. Inspect these files before replacing anything:

| Path | Current purpose | Suggested adaptation |
| --- | --- | --- |
| app/page.tsx and app/layout.tsx | Landing page and metadata | Rebrand to MathMatch; make discovery easy to reach |
| app/globals.css | Existing application styling | Extend for cards, gestures, editor, and responsive layout |
| app/problems/page.tsx | Problem library | Retain as a secondary browse view |
| app/problems/[id]/page.tsx | Individual problem page | Reuse as the attempt route and support direct links |
| components/Math.tsx | KaTeX rendering | Reuse for problem statements and feedback |
| components/ProofEditor.tsx | Proof input, grading UI, solution reveal | Add autosave, revision history, and explicit loading/error states |
| lib/problems.ts | Problem types and lookup | Add curated metadata and a public problem representation |
| lib/grader.ts | Rubrics and model configuration | Reuse carefully; distinguish grading strictness from problem difficulty |
| app/api/grade/route.ts | Existing server grading endpoint | Add validated response handling and integrate attempts |
| data/imo-2023-shortlist.json | IMO shortlist content | Reuse checked records with stable IDs and source attribution |
| data/amc8-2023.json | AMC content | Useful for accessible challenges; require reasoning, not only an answer |
| problems.json | Additional large dataset | Inspect schema and provenance before using; do not assume it is ready |
| scripts/ | Existing extraction/conversion utilities | Preserve; bulk corpus ingestion is outside this first iteration |

The inspected package file uses Next.js 16.3.5, React 19.3.0, TypeScript, KaTeX, and pnpm 11.19.0. Keep the existing stack and lockfile unless a specific incompatibility requires a change. There is no need to introduce Flask or another app server.

The existing grade endpoint accepts problemId, proof, rigor, and model, and returns score, verdict, summary, feedback, gaps, model, and rigor. Verify the current contract before modifying it. Do not assume the existing grader is a validated mathematical judge.

## 4. User experience

### First visit

Show the MathMatch name and a short explanation: “Find a problem worth falling for.”

Offer a short, skippable onboarding:
- Topics of interest: algebra, combinatorics, geometry, and number theory.
- Self-reported starting level: getting started, competition practice, or advanced proofs.
- Session mood: quick challenge, comfortable practice, or stretch.

Treat these as initial preferences, not measured skill. Default to a mixed, accessible deck when onboarding is skipped. Allow preferences to be changed later.

### Discover

Show one readable problem card at a time:
- Full problem statement with rendered math.
- Topic and technique tags where available.
- Source and original problem identifier.
- Approximate difficulty, labelled as an estimate.
- One concise recommendation explanation grounded in actual data.

Offer visible **Pass** and **Try this** buttons as well as swipe gestures. Dragging right and clicking Try this must trigger the same action. Dragging left and clicking Pass must trigger the same action.

Cards should accommodate long statements without clipping. Scrolling a long problem must not accidentally trigger a swipe. Support keyboard use, visible focus, touch, and reduced motion.

After a pass, optionally ask why: “Not my topic,” “Too hard,” “Already solved,” or “Not now.” Make this dismissible. Offer undo for the latest pass, and reverse its recommendation effect when undone.

Do not show the same passed card again immediately. When the deck is exhausted, offer explicit options to revisit passes or adjust filters.

### Attempt

Right swipe immediately opens the selected problem's proof workspace. It does not mark the problem solved.

Keep the problem visible alongside or above the editor. Include:
- Autosaved draft with a clear saved/error indicator.
- Proof input and optional rendered preview.
- Submit for feedback.
- Save and return to discovery.
- A route back to unfinished attempts.

Leaving the editor preserves the draft. Returning restores it. Local storage failures must not silently discard the user's text.

### Feedback and revision

Show:
- A provisional AI score on the existing 0–7 practice scale.
- A short verdict and summary.
- Specific strengths.
- The first important gap and further actionable feedback.
- Revise and resubmit.
- Continue discovering.

Call the result “AI feedback” or “Estimated practice score,” not an official IMO grade. For AMC problems, explain that the score evaluates written reasoning rather than official AMC scoring.

A revised proof is a new submission snapshot. Keep its feedback associated with that exact text. If the user changes the draft, mark old feedback as belonging to the previous submission.

If the grader is uncertain, say so and avoid treating the attempt as solved or updating ability from it. Preserve the existing solution reveal feature behind an explicit action and record whether the solution was viewed.

### Progress

Use a lightweight “My matches” view for saved attempts, revisions, and completed problems. Distinguish:
- Selected to attempt.
- In progress.
- Feedback received.
- AI-assessed complete.
- Practised with a revealed solution or other assistance.

Do not count right swipes or repeated submissions as additional solved problems.

## 5. Visual direction

Build a polished, playful interface with a distinctive MathMatch wordmark, a central card deck, restrained motion, and obvious pass/try controls. A warm background with coral or rose accents is a suggested palette.

Keep notation legible and provide enough space for actual problem statements. Playful copy belongs around the mathematical content; do not rewrite official statements into jokes.

Use a phone-friendly single-column flow and a comfortable desktop proof workspace. Provide loading, empty, error, and exhausted-deck states as part of the main design.

Do not show invented compatibility percentages, fake user counts, fake friends, or pretend grading activity.

## 6. Recommendation behavior

Maintain **interest** and **ability** separately, ideally by topic.

For the first version, curate difficulty into a consistent ordinal scale, such as 1–5. Labels must be reviewed by a team member. Contest year or a problem's index alone is not a reliable cross-contest difficulty rating.

Use this simple starting policy:
1. Exclude already completed problems and temporarily suppress recent passes.
2. Prefer problems near the user's current topic difficulty target.
3. Favor stated interests and positively selected topics.
4. Reserve approximately one in five selections for an eligible problem outside the strongest preference.
5. Attach a factual explanation derived from the selection rules.

Proposed update rules:
- Generic pass: no ability penalty.
- “Not my topic”: modestly lower interest in that topic.
- “Too hard”: offer easier nearby problems without claiming the user failed.
- “Already solved”: exclude the problem; do not treat self-report as independently graded success.
- Right swipe: modest positive interest signal; no ability increase.
- Two distinct, independently completed problems near the current topic target: allow the target to rise one band.
- Repeated graded struggles on distinct problems: offer an easier next problem; keep the adjustment gradual.
- Revised, hinted, or solution-assisted work: record learning progress but do not count it as a fresh independent success.
- Provider failures and uncertain grades: no ability update.

Use only a designated, consistent rigor standard for ability updates. Scores from “Idea” and “Axiomatic” modes are not interchangeable.

These are prototype heuristics, not a scientifically calibrated rating system. Keep constants together, test the rules, and make updates idempotent. Regrading the same attempt must not repeatedly increase its influence.

## 7. Data and persistence

Keep stable existing problem IDs. Add metadata without destroying source content.

Suggested entities:

| Entity | Minimum fields |
| --- | --- |
| Public problem | id, statement, topic, techniques, sourceUrl, set, sourceIdentifier, difficultyBand, contentReviewStatus |
| Private reference | problemId, referenceSolution, officialAnswer if applicable, rubric/version |
| User preferences | userId or local profile ID, preferredTopics, startingLevel, sessionMood |
| Interaction | id, userId, problemId, action, optional passReason, timestamp, optional undoneAt |
| Attempt | id, userId, problemId, currentDraft, state, createdAt, updatedAt, assistance flags |
| Submission | id, attemptId, revision, immutable proof text, timestamp |
| Grade | id, submissionId, status, score or null, verdict, summary, strengths, gaps, nextStep, model, rigor, rubricVersion |
| Topic state | userId, topic, interestWeight, targetDifficulty, evidenceCount, processedAttemptIds or equivalent deduplication |

For the fastest initial demo, use versioned local storage for preferences, interactions, and drafts behind a small persistence interface. Label this as “Saved on this device.” Do not claim account sync. Keep browser-only storage access out of server rendering.

For persistent accounts, add Supabase Auth and Postgres behind that interface. Users may access only their own drafts, interactions, and grades. Public problem metadata can be readable to everyone; reference solutions should not be included in discovery payloads. Enforce ownership in server operations and database policies. Add migrations and environment documentation when implementing this phase.

The current editor accepts the reference solution as a client prop. Review that path: collapsed UI does not keep an answer out of the browser. If preserving deliberate reveal, serve it through an explicit reveal action and record assistance. Do not import the full solution-bearing dataset into a client deck component.

## 8. AI grading integration

Extend the existing server endpoint rather than rebuilding a parallel grader.

- Keep API keys on the server and use environment configuration.
- The server retrieves the canonical statement and reference by problem ID; never trust a browser-supplied reference solution or score.
- Accept valid alternative approaches. Reference-solution similarity is not a grading criterion.
- Treat student text as material to assess, not instructions that can override the rubric.
- Validate request sizes and validate the returned object at runtime. JSON parsing and TypeScript casts alone are insufficient.
- Preserve score, feedback, model, and rubric provenance for each immutable submission.
- Add an explicit uncertain outcome, with nullable score if appropriate, and update both client and server together.
- Handle missing credentials, timeouts, refusals, malformed responses, provider errors, and exhausted quota with recoverable UI states.
- Disable duplicate submissions while a request is pending and deduplicate server-side grading by submission ID when persistence is added.
- Apply server-side usage limits before public deployment; control allowed models and output limits from the server.
- Verify model availability and API compatibility in the configured account during implementation. Do not rely on unverified “strongest” or “cheapest” labels already in the UI.
- Keep error messages helpful without exposing raw provider internals.

The first implementation can use the existing request/response flow with a bounded timeout. If actual grading latency outgrows the deployment's request duration, introduce persisted jobs and polling. Do not use an unawaited background promise as durable job processing.

A development fixture mode may return deterministic feedback for interface tests. Label it “Demo feedback” and keep it clearly separate from real AI results.

## 9. Build sequence

### Milestone 1 — Rebrand and discover

- Pull the current repository and inspect existing instructions.
- Rename visible branding, metadata, and relevant documentation to MathMatch.
- Create the swipe deck with equivalent buttons and keyboard controls.
- Reuse the existing math renderer and curate an initial eligible problem subset.
- Wire right swipe to the existing attempt route; implement pass, optional reason, and undo.

Done when a user can navigate a readable deck on phone and desktop, select an actual problem, and return without losing deck position.

### Milestone 2 — Complete the attempt loop

- Add local draft persistence and a saved-attempt list.
- Integrate the existing grader with loading, failure, uncertainty, and revision states.
- Store submission snapshots and mark solution-assisted attempts.
- Preserve drafts across refresh and failed grading.

Done when a user can submit, inspect feedback, revise, and recover an unfinished attempt after refresh.

### Milestone 3 — Make matching visibly adapt

- Add onboarding and curated difficulty metadata.
- Implement deterministic recommendation rules and explanations.
- Track preference separately from ability.
- Add the progress view and explicit empty/deck-exhausted behavior.

Done when a reproducible demo shows different recommendations following stated interests and graded evidence, without interpreting every pass as failure.

### Milestone 4 — Persistence and deployment readiness

- Add Supabase accounts and owned data if credentials and time are available.
- Add usage controls for the grading endpoint.
- Document configuration, deployment, and any remaining demo-only limitations.
- Open a PR with a concise walkthrough, screenshots, checks, and known limitations.

Do not provision paid services or deploy publicly solely on the authority of this brief. Prepare the app and provide the required setup steps.

## 10. Acceptance checks

Run the repository's lint, typecheck, and production build commands. Add targeted tests for behavior that can lose data, spend money, or corrupt recommendations.

Check that:
- Swipe gestures and buttons perform identical actions.
- Vertical scrolling and text selection do not accidentally dismiss a problem.
- Keyboard controls do not fire while typing in the proof editor.
- Passing does not mark a problem solved or lower ability.
- Undo reverses the latest pass and its recommendation effects.
- Refresh restores the correct draft and saved attempts.
- Feedback remains bound to the submitted proof revision.
- Failed/uncertain grading preserves the proof and leaves ability unchanged.
- Duplicate submissions do not create duplicate grading charges where server deduplication is implemented.
- Revisions cannot farm ability updates.
- Revealed solutions are recorded as assistance.
- Recommendation explanations match the actual rules.
- Exhausted decks have an explicit recovery path.
- Reference solutions and secret keys do not appear in discovery data or client bundles.
- If accounts are added, one user cannot retrieve or alter another user's private work.

Before claiming grading quality, evaluate a small team-reviewed set containing complete proofs, valid alternative proofs, partial progress, subtle errors, irrelevant answers, and instruction-injection attempts. Report disagreements. Do not claim reliable mathematical correctness solely because the endpoint returns a number.

## 11. Hackathon demo

1. Choose an interest and starting level.
2. Pass a problem outside that interest.
3. Swipe right on a suitable problem.
4. Submit a short proof with a known gap.
5. Receive specific feedback and revise it.
6. See the attempt saved and a relevant next recommendation.
7. Explain why that problem was selected.

Use a checked problem that fits the presentation time. If live API access fails, explain the failure or switch to an explicitly labelled fixture demonstration.

## 12. Later scope

Defer full IMO archive coverage, handwriting recognition, mock exams, friend leaderboards, messaging, trained recommendation models, and formal proof verification until the central loop works.

A later social feature can let friends share the same problem and compare participation or progress. AI scores should remain provisional rather than becoming an unquestioned competitive ranking.
