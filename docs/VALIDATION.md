# Validation record — current through 2026-11-24

## Evidence categories

Synthetic tests, private original-sample checks, local generated-file checks, container round trips, and maintainer-reported retail gameplay tests are separate. CI does not run private saves or establish console acceptance.

## Reconstruction baseline

- 34 original synthetic unit tests passed locally; rerun with `npm test`.
- Five original ASAV bodies decoded to JSAV v3 with 82 indexed blocks each; all five original 32-byte trailers reproduced exactly.
- Independent liblz4 compatibility, byte-identical no-op behavior, 15 baseline local edits and 2,144 slot-normalization round trips were recorded in the historical research.
- The latest sixth original ASAV matched the local container export byte-for-byte, and its own decoding exactly matched the web-provided JSAV.

## Current writer and packaging

- Nine initial inventory/mirror/ledger-consistent local cases passed for the latest sample.
- Sixteen experimental-increases cases passed, including cap boundaries. Existing numeric tokens outside allowed edits were preserved; original samples were unchanged.
- Corrected a PowerShell argument-construction defect that produced Invalid options.
- The first package failed local CoW encryption because the web export lacked PS5IMAGE. Re-decrypting the original container locally supplied PS5IMAGE, PS5KEY and PS5PARAM_SIZE. Only the edited game file was replaced; supporting files remained byte-identical.
- The encrypted reduction result was re-decrypted and its recovered ASAV matched the intended edit exactly, with original param.sfo, keystone and icon unchanged.
- A later experimental package was verified to contain 20,000 cash / 2,000,000 checking / 490,000 savings. Do not relabel that particular test as 1,000,000 savings.
- The guided workshop's real local encryption/return-file verification passed using an unchanged source copy: 10,000 / 17,860 / 354,800. No retail restoration was performed by the automated integration test.

## Maintainer-reported retail acceptance

The maintainer restored the inventory-consistent edit to a stock retail PS5, manually loaded the target slot and confirmed 9,900 cash, 17,760 checking and 354,700 Family Savings. The maintainer then reported all edited amounts persisted after manual saving and reloading.

An initial apparent failure was loading the autosave instead of the edited manual slot. A file-path mismatch was investigated, but settings showed both active paths pointing at the profile containing the edited file; the earlier mismatch explanation was withdrawn.

Later, a screenshot displayed 2,001,000 checking and a 3.9M displayed capacity, followed by a maintainer report that the balance persisted after save/reload. This is evidence of one accepted above-2M balance. It does not independently establish the cause of the displayed capacity, universal checking capacity, or 1M savings acceptance. Detailed per-transaction/max-cap behavior remains to be corroborated from fresh exports.

## Read-only checker

Ten synthetic tests passed: encoded/unknown/malformed input rejection, inventory discovery without a 21-inventory assumption, exact unsafe GUID handling, duplicate GUID/invalid parent rejection, ledger inconsistency detection, private-canary exclusion and unchanged-input checks. Six preserved decoded samples were inspected; their original source files remained unchanged. GUI ZIP inspection passed. An externally supplied Xbox-labelled sample was subsequently decoded and verified locally; see CROSS-PLATFORM-TEST.md.

## Not established

Universal write compatibility; automatic character ownership mapping; every campaign tier/build; unrestricted container capacity; broad independent reproduction across users; public codec independence; general Xbox/PC acceptance beyond the one externally reported build; online-only encryption/restoration; priority over existing projects. Historical field-only editor outputs are not promoted to accepted edits.

## External load/save/reload evidence — 2026-11-25

0xSavior reports their rebuilt Prologue control loads, and the PS5-derived ASAV-v2 probe loads into free roam and can save/reload in their Xbox-derived PC build. Local checks reproduced the original Xbox-labelled trailer, verified exact decoded control content and restricted probe changes to version/checksum/trailer. No source sample is public. See [full evidence and limitations](CROSS-PLATFORM-TEST.md).

## Generalized writer development — 2026-11-25

- Added synthetic discovery/edit tests with reordered inventories, nonstandard inventory counts, different balances and character codes, exact no-op output, zero/cap boundaries, ambiguous mapping rejection and repeated edits.
- Added single-container and uniquely corroborated multi-container mirror-scope regression tests. These cover a relationship observed in a later gameplay-resaved input, not a universal ownership algorithm.
- Added remote-adapter tests for consent, fixed HTTPS endpoints, user-provided authentication, missing account setting, private-error suppression and bounded polling. No live upload is part of these tests.
- New output remains decoded JSAV until separate game/container processing. The decoded editor does not claim to produce a playable encrypted save on its own.

## Generalized writer/online verification follow-up

The suite now includes 18 new generalized-writer, remote-protocol and SFO tests (64 source-only tests total with the earlier suites). Four private local ASAV rebuilds passed at zero/max targets across two preserved profiles, with no original changes. These private checks were not run by CI.

With the owner's explicit approval, a slot-11 copy was processed through GarlicSaves. The web JSAV matched the local decode. The first encrypted return preserved game data but reversed the account-ID bytes; verification caught the mismatch and the result was not approved for restoration. The corrected original-SFO wire-byte convention produced byte-identical edited JSAV and original param.sfo, keystone and icon after re-decryption.

The consent-based GUI pipeline then repeated the successful encryption/verification with cash 20,000 / checking 2M / savings 1M. It stored no API key and performed no restoration. No other person's sample was uploaded. This establishes a tested client/service route for that input, not universal service or game acceptance.

## Browser profile correction — 2026-11-25

User screenshots document Dashboard Swap Endian, equal Previous/New Account ID on encryption, and a successful decrypted-return comparison. This validates one browser content/account round trip. No new console restoration or gameplay persistence is established. Earlier local GarlicMgr tests did not require this website profile correction.

## Failed gameplay acceptance — 2026-11-25

User reports GTA VI rejected the restored browser-processed generalized editor output with Could not load, despite a successful decrypted-return comparison. Cause undetermined: game-level reconstruction, edit consistency, container/transfer selection and other dependencies require isolation. No further automatic restoration. Public warning added.

## Confirmed public-workflow PS5 acceptance — 2026-11-25

A controlled attempt used separate original, edited, encrypted and verification folders. Exact returned JSAV and original account/support files matched. Verified targets: cash 19,999; checking 1,999,999; Family Savings 1,000,000. The maintainer supplied an in-game cash/checking screenshot and then confirmed the requested savings/save/reload checks. Browser profile Swap Endian was used after confirming byte-order reversal. The encrypted SAVEDATASARC0011 container, not decrypted SARC0011, is required for transfer. This supersedes the temporary blanket restoration warning, not the historical record of earlier failures. The precise cause of each earlier failed attempt is not established. Coverage remains one tested PS5 save/console; no general Xbox money editing or universal compatibility claim.

## Experimental stash preview — 0.5.0-stash-preview.1

This separate prerelease adds **Bed stash** handling for supported decoded early-game layouts. It is not stash gameplay-validated. Keep the previously tested 0.4 beta available for bank-era workflows.

The selected stash must have a unique registered container relationship and a uniquely corroborated character-statistic relationship. Cash is separate; if no cash wallet exists its field stays disabled and zero. Checking and Family Savings remain read-only whenever the experimental stash profile is active—even if those accounts already exist. The profile is selected by structure, never chapter number.

Stash edits use a conservative 20,000 policy ceiling (or the current original amount if higher, without further increases). This is NOT a discovered stash capacity. Only matching current combined-money mirrors are updated; stale unmatched records are preserved. Unsupported/ambiguous layouts remain blocked. No wallet/container creation occurs in this profile.

Local GarlicMgr can export a PS5-decrypted container whose game file still begins with ASAV. This editor now explains that second layer rather than treating it as JSAV. The tested website route can supply JSAV, but users must consent to third-party processing. No private decoder/game inputs are included or automatically downloaded. Decoding ASAV alone does not guarantee a supported edit layout.

Nested exports such as PPSAxxxxx/sdimg_SAVEDATASARC0000/SARC0000 are recognized. On ZIP export the leading title-ID folder is removed for the browser handoff; save-relative content and support files are preserved. Raw JSAV exports alone still lack the support metadata needed for website encryption.

Tests: 70 automated checks total, including six new stash/error cases. Six privately held decoded samples passed experimental decrease/reparse and exact no-op checks; originals were not modified or uploaded. In-game stash load/save/reload acceptance remains REQUIRED before claiming supported gameplay. No private saves, identifiers or sample hashes are published.

## External stash gameplay confirmation — 2026-11-26

The owner relayed volunteer confirmation that the prepared PPSA38500 early-game test loaded with 20,000 bed stash and zero on-hand cash, then retained the values after saving and reloading. The volunteer reported resigning it to a second account. This is externally reported acceptance for one sample, not an independently observed console session or general resigning compatibility.

The game-level ASAV in that test was rebuilt with the maintainer’s private local codec; the public preview still does not distribute an ASAV decoder. The tested scalar edit is the experimental stash writer’s output. No missing cash wallet was created, and bank/savings remained unchanged. Keep broader stash support experimental pending additional samples. This supersedes earlier blanket statements that no stash gameplay test had occurred, while preserving their historical timing.
