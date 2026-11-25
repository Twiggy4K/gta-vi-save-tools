# Research log

## 2026-11-23 — Body and integrity reconstruction

Five preserved story samples decoded into structured JSAV v3. Initial whole-body and unkeyed digest shortcuts were rejected. The protected body excludes the final 32-byte trailer, requires padding validation, and contains raw LZ4 data. The counter transform was reconstructed and unchanged body round trips verified.

The trailer uses a descriptor-initialized encoded pipeline. A shifted-operation tail was corrected to read the mapping stream rather than caller input. A failed forward/backward diagnostic was traced to omitted slot-specific normalization in the caller; adding the actual bridges yielded 2,144 successful round trips across eight slots.

A plain-state SHA-256 compression core was identified and independently checked against Node crypto. The remaining encoded outer path was reproduced with a bounded arithmetic model of reviewed static data flow. All five original trailers then matched exactly, with deterministic repeats and negative mutation checks.

## 2026-11-23 — Baseline editor

The controlled purchase and no-action samples identified one 338 -> 317 -> 317 numeric candidate. Identity columns, rather than a fixed row index, locate it. The implementation now patches original numeric tokens, repairs indexed block ranges, recompresses, protects and regenerates header/trailer data.

Fifteen local test edits and corresponding reverse edits passed across five preserved saves. Cash identity relocation and ambiguity checks were added. The independent compressor passed system liblz4 checks. A Windows interface creates separate test copies and local manifests.

The first actual desktop launch exposed a missing Node PATH dependency that the original development environment had hidden. Explicit runtime resolution fixed that issue, and a reduced-PATH smoke test verified the change.

## 2026-11-23 — External evidence correction

Web results appeared to expose upstream GTA VI editor source, but direct GitHub connector checks later returned 404 for the cited paths and a sanitized repository snapshot did not corroborate those claims. The claims were retracted. The discrepancy's cause is unknown; the purported code was not used in this project. No competitor priority or first-of-its-kind conclusion is established.

## 2026-11-23 — Private source archive

the maintainer requested a private GitHub backup with documentation and changelog tracking. A separate source checkout was prepared from an explicit file allowlist. Personal saves, generated outputs, account/container metadata, executable files, tables, disassembly and machine-specific runtime configuration were excluded. The original local working installation remains separate.

Current blocker for gameplay claims: an edited save has not yet been restored and tested in-game. Current blocker for bank support: fresh controlled bank-transaction samples are needed.

## 2026-11-23 — Detailed retrospective for cross-chat review

the maintainer requested an extremely detailed account for review with independent review. [DETAILED-RESEARCH-HISTORY.md](DETAILED-RESEARCH-HISTORY.md) consolidates the preserved local reports, code and result metadata into 35 stages. It records failed hypotheses and corrected mistakes, distinguishes synthetic/known-original/local-rebuild/gameplay evidence, and preserves the limits of the current result. Private source artifacts and saves remain excluded.

## 2026-11-24 — External audit and semantic correction

Corey's public editor was verified at `ae577a5ae6168e04953594868f4ee1d0e3042287`, including v0.2.0 implementation `9a3d27705a24fb9c5d8fe000016c9d48b837c9b2`. Its local edit starts with JSAV supplied after remote GarlicSaves processing; it does not contain a local ASAV decoder/trailer generator. Its money hierarchy is materially more complete than this baseline prototype.

Independent inspection identifies the old cash candidate as statistic ID 265. The matching inventory quantity moved between rows and was missed by the original same-path comparison. A separate statistic total also changed. Old baseline output copies remain statistic-only experiments, not established useful cash edits.

Exact original numeric tokens are required for inventory GUID comparisons; their values exceed JavaScript's safe-integer range. An isolated independently written reader and restricted early-campaign consistency experiment passed eight synthetic tests and fifteen additional full local edits. No upstream implementation was merged, no private saves uploaded and no console restoration attempted. The original 34-test baseline and fifteen baseline edits still pass.

The complete private local audit is at `the separately held private external-research workspace`. Bank/savings semantics, later-campaign mapping, vehicle insertion and gameplay acceptance remain unverified. Historical results above are unchanged; this entry narrows the semantic interpretation of the original candidate.

## 2026-11-24 — current-profile writer, retail persistence and closed testing

The statistic-only cash candidate was identified as a mirror; the consistent writer now updates inventory quantities, relevant statistics and global ledgers. The sixth original ASAV matched its web JSAV decode and local container export. Local CoW packaging needed the matching PS5IMAGE and companions; return-file comparisons passed.

The maintainer reports retail acceptance and manual save/reload persistence at 9,900 cash / 17,760 checking / 354,700 savings. The apparent first failure was loading the autosave. A later screenshot/report establishes 2,001,000 checking persistence and displays 3.9M capacity without establishing its cause. A particular verified increases package had 490,000 savings, not 1M.

The separate workshop adds backups, packaging, local encryption and verification; its no-change integration passed. The standalone read-only checker passed 10 synthetic tests and inspected six preserved samples. No external tester save has yet been checked. Source snapshots and current docs are now archived; private dependencies and historical identity review still block public editor release. Earlier log entries are historical snapshots. See CURRENT-FINDINGS.md and detailed history sections 36–44.

## Public prerelease — 2026-11-25

Clean-history publication and MIT are now authorized. The public artifact is a runnable read-only checker; workshop/editor code remains experimental source with undistributed private inputs. 0xSavior is credited with reported rebuilt-control loading and PS5-derived free-roam load/save/reload in one Xbox-derived PC build. Samples remain private. See CROSS-PLATFORM-TEST.md.
