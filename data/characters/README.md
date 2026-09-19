# MathMatch character assets

Twenty individual original generated character illustrations, five per topic. Generated with OpenAI's built-in imagegen tool using the approved MathMatch sketch as the style reference: scratchy ink, muted colours, patched props, awkward proportions, whimsical expressions.

## Files and integration

- Each category folder contains exactly five PNG files with genuine RGBA transparency, verified alpha range 0–255. No opaque paper backdrop is baked in.
- [manifest.json](manifest.json) provides stable IDs, names, topics, paths relative to this folder, dimensions, concepts, alt text, byte sizes, and Git blob hashes.
- Preserve aspect ratio and use `object-fit: contain`; source dimensions vary. Render in a consistently sized card portrait region. These are full-resolution source assets, roughly 1–2.7 MB each; use Next.js image optimization when integrating.
- Files under `data/` are not automatically public URLs. Devin can use explicit static imports with `next/image`, or copy assets into `public/characters/` during integration and map the manifest paths. Do not use `/data/characters/...` as a browser URL.
- Select a character deterministically from the problem ID within its topic so opponents remain recognizable. Variant numbers do not encode difficulty. More specific technique matching requires separate problem annotations.
- The existing app topic is `number theory`; its asset folder is `number-theory`. The manifest handles this distinction.
- This commit adds assets and documentation only; it does not wire characters into the UI.

## Mathematical motifs

These are character illustrations, not instructional diagrams. The integral character is calculus-inspired decoration requested for the algebra family; it does not imply HARP contains integration problems. Instrument ticks are decorative rather than calibrated measurements. The number-theory figures include prime factorization, modular arithmetic, the Euclidean algorithm, CRT, and a concrete valid Fermat example.

## Gallery

### Algebra

| The Sum Collector | The Integral Snatcher | The Root Wraith | The Matrix Marshal | The Polynomial Puppeteer |
| --- | --- | --- | --- | --- |
| <img src="algebra/01-sum-collector.png" width="160" alt="Masked trickster carrying a summation-symbol staff."> | <img src="algebra/02-integral-snatcher.png" width="160" alt="Purple trickster with integral staff and dx tag."> | <img src="algebra/03-root-wraith.png" width="160" alt="Hunched figure with radical hat and square-power pendant."> | <img src="algebra/04-matrix-marshal.png" width="160" alt="Broad masked figure with bracket shoulders and a two-by-two shield."> | <img src="algebra/05-polynomial-puppeteer.png" width="160" alt="Trickster controlling three variable puppets."> |
| Summation | Integration (calculus-inspired visual) | Radicals and powers | Matrices | Polynomial terms |

### Combinatorics

| The Pigeonhole Warden | The Permutation Committee | The Combination Chooser | The Lattice Path Courier | The Inclusion–Exclusion Inspectors |
| --- | --- | --- | --- | --- |
| <img src="combinatorics/01-pigeonhole-warden.png" width="160" alt="Chief pigeon with four pigeons crowded into three compartments."> | <img src="combinatorics/02-permutation-committee.png" width="160" alt="Three pigeons exchange labelled hats inside a trench coat."> | <img src="combinatorics/03-combination-chooser.png" width="160" alt="Pigeon selects a pair of coloured tokens."> | <img src="combinatorics/04-lattice-path-courier.png" width="160" alt="Pigeon courier wearing a grid-route cape."> | <img src="combinatorics/05-inclusion-exclusion-inspectors.png" width="160" alt="Two pigeon clerks carry overlapping nets with a shared token."> |
| Pigeonhole principle | Permutations | Unordered selections | Lattice paths | Inclusion–exclusion |

### Geometry

| The Compass Duellist | The Divider Duellist | The Protractor Crab | The Ruler Swordsman | The Set-Square Sentinel |
| --- | --- | --- | --- | --- |
| <img src="geometry/compass-duellist.png" width="160" alt="Compass-legged Surveyor with a red cape and set-square shield."> | <img src="geometry/divider-duellist.png" width="160" alt="Twin-point drafting instrument with a small moustache and red cape."> | <img src="geometry/protractor-crab.png" width="160" alt="Crab rival with a semicircular measuring shell."> | <img src="geometry/ruler-swordsman.png" width="160" alt="Lanky ruler duellist with oversized boots and pencil rapier."> | <img src="geometry/set-square-sentinel.png" width="160" alt="Triangular sentinel with a pencil spear."> |
| Compass | Dividers | Protractor | Ruler | Set square |

### Number Theory

| The Prime Factor Locksmith | The Modular Clockkeeper | The Euclidean Measurer | The Remainder Master | The Fermat Knight |
| --- | --- | --- | --- | --- |
| <img src="number-theory/01-prime-factor-locksmith.png" width="160" alt="Beetle with a 30 shell and keys 2, 3, and 5."> | <img src="number-theory/02-modular-clockkeeper.png" width="160" alt="Beetle with a cyclic wheel of residues 0 through 4."> | <img src="number-theory/03-euclidean-measurer.png" width="160" alt="Beetle with rectangular tiles and measuring keys."> | <img src="number-theory/04-remainder-master.png" width="160" alt="Beetle with locks labelled 3, 5, and 7 and a master key."> | <img src="number-theory/05-fermat-knight.png" width="160" alt="Beetle knight with the example 2^4 congruent to 1 modulo 5."> |
| Prime factorization | Modular arithmetic | Euclidean algorithm | Chinese remainder theorem | Fermat's little theorem |

## Generation notes

[GENERATION.md](GENERATION.md) records the prompts/specifications for future variations. Original generated PNGs were copied without image postprocessing. All 20 were visually reviewed and alpha-checked; uploaded Git blob hashes match the local files. AI-generated illustrations are separate from the HARP dataset and its license.
