/**
 * Writes a display name and a spoiler-free taunt for every problem in the deck
 * that has no hand-written profile, into data/problem-profiles.json.
 *
 *   OPENAI_API_KEY=... node scripts/name_problems.mjs
 *
 * Existing entries are kept, so a regenerated deck only costs calls for the
 * problems that are actually new.
 */
import { readFileSync, writeFileSync } from "node:fs";

const DECK = "data/harp-deck.json";
const OUT = "data/problem-profiles.json";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const BATCH = 10;
const PARALLEL = 6;

const SYSTEM = `You title competition maths problems for a medieval duelling game.
For each problem return:
- "name": a 2-4 word title in Title Case naming the objects or the hook of the problem
  ("Corner Cubes", "Powers of Nine", "Twin Digits"). No contest names, no numbers of
  the form "Problem 12", no spoilers of the answer, no punctuation at the end.
- "bio": one or two sentences, first person, spoken by the problem as a challenger.
  Say what the problem is about and what it takes, never the answer or the full method.
Reply with JSON: {"items":[{"id":"...","name":"...","bio":"..."}]}`;

const curated = new Set(
  readFileSync("lib/profiles.ts", "utf8")
    .match(/"HARP-[\w-]+":/g)
    .map((line) => line.slice(1, -2)),
);

const deck = JSON.parse(readFileSync(DECK, "utf8"));
let out = {};
try {
  out = JSON.parse(readFileSync(OUT, "utf8"));
} catch {
  out = {};
}

const todo = deck.filter((p) => !curated.has(p.id) && !out[p.id]);
console.log(`${deck.length} problems, ${curated.size} hand-written, ${todo.length} to name`);

const batches = [];
for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));

async function name(batch) {
  const body = {
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: JSON.stringify(
          batch.map((p) => ({
            id: p.id,
            topic: p.topic,
            statement: p.statement.slice(0, 900),
          })),
        ),
      },
    ],
  };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const json = await res.json();
  const items = JSON.parse(json.choices[0].message.content).items ?? [];
  const ids = new Set(batch.map((p) => p.id));
  return items.filter((item) => ids.has(item.id) && item.name && item.bio);
}

let done = 0;
async function worker(queue) {
  while (queue.length > 0) {
    const batch = queue.shift();
    try {
      for (const item of await name(batch)) {
        out[item.id] = { name: item.name.trim(), bio: item.bio.trim() };
      }
    } catch (error) {
      console.error("batch failed:", error.message);
    }
    done += 1;
    if (done % 5 === 0) console.log(`${done}/${batches.length} batches`);
  }
}

await Promise.all(Array.from({ length: PARALLEL }, () => worker(batches)));

const ordered = Object.fromEntries(Object.keys(out).sort().map((id) => [id, out[id]]));
writeFileSync(OUT, `${JSON.stringify(ordered, null, 1)}\n`);
console.log(`wrote ${Object.keys(ordered).length} profiles to ${OUT}`);
