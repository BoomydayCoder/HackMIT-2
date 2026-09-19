# HARP data for MathMatch

## Attribution

Human Annotated Reasoning Problems (HARP), by **Albert S. Yue, Lovish Madaan, Ted Moskovitz, DJ Strouse, and Aaditya K. Singh** (2024).
Source: https://github.com/aadityasingh/HARP
Paper: https://github.com/aadityasingh/HARP/blob/dac2734ff6443bcaf3bbdcb10f13cf21ae9729c2/HARP.pdf

The two ZIP archives are unmodified upstream files, imported on 2026-09-19.
Upstream revision: `dac2734ff6443bcaf3bbdcb10f13cf21ae9729c2`.
The upstream MIT license and copyright notice are preserved verbatim in [LICENSE](LICENSE).
Original contest problems and contributed solutions retain their respective provenance; this attribution does not assert ownership of their underlying content.

Suggested user-facing credit when integrating:
“Problems and reference solutions sourced from HARP (Yue et al., 2024), compiled from US mathematics competitions.”
Link HARP and display each problem's original contest, year, and number. Retain these credits and the bundled license when redistributing this collection.

## Included data

| Archive | Records | Years | Contests | Observed difficulty |
| --- | ---: | --- | --- | --- |
| HARP.jsonl.zip | 4,780 | 1950–2024 | AHSME, AJHSME, AMC 8/10/12, AIME and variants | 1–6 |
| HARP_proof-based.jsonl.zip | 310 | 1972–2024 | USAMO, USAJMO | 6–9 |

Total: **5,090 distinct contest/year/number identifiers**. These files include statements and human-written solutions, not just an index. They do not contain the IMO shortlist; retain the existing separate IMO source for that coverage.

The original compressed format is preserved in keeping with upstream's preference to avoid putting benchmark text in plain text on the web. Each archive contains JSONL: one JSON object per line. Unzip locally for ingestion. The alternative multiple-choice and raw upstream splits are not included because they overlap the selected collections.

## Record fields

| Field | Meaning |
| --- | --- |
| problem | Statement, including mathematical markup |
| answer | Reference short answer in the main split; absent from proof records |
| solution_1 … solution_N | Human-written reference solutions; at least one per record |
| num_solutions | Number of stored solutions |
| subject | One broad subject label from the six listed below |
| level | Upstream ordinal difficulty label; not an empirically calibrated MathMatch rating |
| contest | Original contest identifier |
| year | Contest year |
| number | Problem number within the contest |
| multiple_choice_only | Upstream flag for dependence on multiple-choice format; preserve it during import |

Observed maximum solutions per record: 14 in the main split, 10 in the proof split.
There are no per-problem student success rates, solve-time statistics, user ratings, or fine-grained technique tags.
Derive response format from the split; do not infer it from subject.
Retain contest/year/number as a composite source identifier, with a HARP namespace for application IDs.

## Subject counts and proposed MathMatch mapping

| HARP subject | Main | Proof | Proposed MathMatch topic |
| --- | ---: | ---: | --- |
| algebra | 970 | 76 | algebra |
| counting_and_probability | 812 | 62 | combinatorics |
| geometry | 1,268 | 81 | geometry |
| number_theory | 601 | 68 | number theory |
| precalculus | 240 | 23 | algebra (coarse approximation) |
| prealgebra | 889 | 0 | review/classify individually |

Keep the original subject alongside any derived topic. Prealgebra contains a mixture of elementary topics; do not silently label all of it algebra. Technique tags such as induction, inequalities, modular arithmetic, or pigeonhole principle require a separate annotation step.

Difficulty distribution:
- Main: 1: 799; 2: 1,505; 3: 1,363; 4: 719; 5: 197; 6: 197.
- Proof: 6: 29; 7: 121; 8: 94; 9: 66.

## Integration notes for Devin

This commit supplies source data and documentation only; the current app loader does not yet ingest HARP.
Parse the JSONL during a server-side ingestion/build step, preserve original records, and create a normalized application representation.
Keep reference answers and solutions out of discovery payloads and client bundles.
For short-answer problems, ask for an explanation and distinguish MathMatch reasoning feedback from official contest scoring.
Human-written reference solutions can contain mistakes; review the demo subset and allow alternative correct approaches.
Some content may rely on diagrams or external assets; the upstream images directory is not bundled here. Check rendering and asset dependencies before adding a record to the swipe deck.
Deduplicate by source identity when combining with the existing AMC data.

## Integrity and validation

Both archives passed ZIP CRC checks. All 5,090 lines parsed as JSON, had nonempty statements and first solutions, and matched num_solutions to the stored solution fields. No source-identifier duplicates were found across these two splits.

SHA-256:
- HARP.jsonl.zip: `40bcbda27876ada4d5de3c26b3f6e4a67d932874f645d4ae7c1fc0aed0e09392`
- HARP_proof-based.jsonl.zip: `c50e24a4f639e1f3c2e0dbd0a944e9bc1cb0f19288bd1cb53722d2a96fe417b9`

## Citation

```bibtex
@misc{yue2024harp,
    title={{HARP}: A challenging human-annotated math reasoning benchmark},
    author={Albert S. Yue and Lovish Madaan and Ted Moskovitz and DJ Strouse and Aaditya K. Singh},
    year={2024},
    url={https://github.com/aadityasingh/HARP}
}
```
