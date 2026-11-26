# Current findings and corrections — 2026-11-24

## What changed since the initial archive

The early numeric cash candidate was a statistic mirror, not a complete authoritative wallet edit. The current sample-specific writer updates inventory currency quantities, matching statistics, combined cash/checking, and continuous checking/savings ledgers. Three-field early-sample experiments preceded the later shared-account mapping; they are not universal mappings.

The current campaign's shared checking and Family Savings are in one inventory; the mapped active wallet is in another. Exact GUID/parent relationships are used rather than floating-point identifier comparisons. Statistic lookup uses IDs plus character codes, not fixed positions 552/3273. The mapping of those character codes to protagonists remains corroborated only for the current profile. Inactive cached balances can differ and are not assumed authoritative.

The checking ledger's running balance is global across owner changes. Selecting a last entry by inventory ownership would pick an obsolete balance. The writer updates the final global entry's balance and delta while preserving arithmetic. This policy has one accepted local-profile gameplay test, not validation for every ledger state.

## Game versus editor limits

The UI limits are 20,000 cash, 2M checking and 1M Family Savings. The savings ceiling is conservative editor policy. The checking ceiling is also conservative: the maintainer reports 2,001,000 persisting after save/reload and a screenshot displays 3.9M capacity. The effect of added money containers on displayed capacity requires further analysis. Neither guide milestones nor UI labels establish a universal serialized limit.

The occupied checking container with unidentified capacity is bounded to its observed original 17,860 quantity in this writer. That restriction must be removed through verified schema discovery, not carried into arbitrary-save support. New supported-capacity boxes and registered currency rows are independently constructed, with GUID uniqueness, parent references and parallel arrays checked.

## Packaging and return workflow

Web exports can provide decoded JSAV while local GarlicMgr exports retain encoded ASAV. These are not interchangeable layers. In the tested web export, chives.dat held the original ASAV at offset 32; it is not the PS5 image sidecar.

CoW encryption required the original PS5IMAGE. A matching local export supplied PS5IMAGE, PS5KEY and PS5PARAM_SIZE in addition to chives.json and sce_sys files. The package preserves the original layout and changes only the game file. Returned containers are decrypted again and compared with the intended edit; matching account metadata and support files are verified.

GarlicTransfer's local replacement operation copies a selected file directly. Selecting a ZIP there does not prove extraction occurred. Use the verified extensionless encrypted container. The Upload selector can operate at whole-game entry granularity rather than individual slot granularity. Verify the actual Library/Upload/metadata paths and preserve independent recovery copies.

## External work and credit

The public CoreyLyu76/gta6-save-editor repository at ae577a5ae6168e04953594868f4ee1d0e3042287 supplied inventory and container identifier research leads. Its public local money logic and remote Garlic processing are distinct from this project's own local ASAV reconstruction. No upstream GPL implementation was copied into the current independent writer. Its earlier release history means no priority claim is established for this project.

The earlier alleged public `services/gta6_money.py` and `routes/gta6.py` evidence was not corroborated and was retracted. That incident does not establish absence of other working editors. GarlicSaves browser observations show server-backed money processing, but inaccessible server implementation is not reconstructed from that UI. The Car Giver editing implementation has not been independently reproduced here; a public SaveRift read-only connector does not constitute a public vehicle writer.

GarlicTransfer supports remote volunteer processing, so a user-owned jailbroken console is not intrinsically required for every possible workflow. The actual workshop route tested here used local GarlicMgr on a separate modded console; a complete online-only route for this editor remains unverified.

## Privacy and public testing

The checker produces allowlisted gameplay/structure reports without original paths, account IDs, GUIDs, keys or save contents. It does not infer game version, protagonist identity or write compatibility from a readable layout. Ask selected testers for reports before requesting private saves. An Xbox-labelled sample has now been checked locally; external load/save/reload evidence is recorded in CROSS-PLATFORM-TEST.md.

Current-tree personal names are generalized. Historical Git objects can still retain older names, docs or commit metadata. This public snapshot excludes that old Git history; the original archive remains private. Public screenshots, reports and video metadata are separate privacy surfaces; no guarantee of anonymity is made.

## Cross-platform update — 2026-11-25

See [the test record](CROSS-PLATFORM-TEST.md) for locally verified ASAV v2 decoding/trailer compatibility and 0xSavior''s reported control loading and imported free-roam save/reload persistence. This does not establish a universal converter or Xbox-side money editing. Source and documentation are published under MIT; no private sample is included.

## Generalized decoded-writer preview — 2026-11-25

The decoded writer no longer requires 21 inventories, fixed inventory positions, a fixed character code, SARC0010 or the original checking amount. It discovers account roots/parents, registrations, wallet candidates and statistic relationships from the current document. One uniquely corroborated subset of currency rows may explain a refreshed bank statistic; full-account statistics are not assumed universally. Unknown/ambiguous mappings fail closed.

Policy caps remain cash 20,000, checking 2M and savings 1M. Mapped containers supply capacity; unknown containers are not overfilled based on a personal original value. A subsequently persisted source supplied a mapped 15,000 currency item/slot pair, enabling policy-cap allocation from a zero bank using supported boxes. This mapping is still build/schema-dependent, not a proof of universal gameplay semantics.

The new decoded editor is runnable with Node/Windows and requires no private codec inputs for decoded editing/ZIP export. Protected ASAV generation and PS5 container encryption remain distinct. The optional remote adapter requires explicit consent and a user-supplied API key; its synthetic protocol tests and one consented live encrypt/decrypt comparison passed. The live result preserved the intended JSAV and original metadata; restoration remains untested for this build.

Online follow-up: the owner-approved slot-11 encrypt/decrypt verification and GUI orchestration passed after correcting account wire-byte ordering; exact game data and original account/support files were checked. No restoration was performed. See VALIDATION.md and the decoded-editor guide; earlier statements that only mock testing existed are historical and superseded by this record.


## Confirmed public-workflow PS5 acceptance — 2026-11-25

A controlled attempt used separate original, edited, encrypted and verification folders. Exact returned JSAV and original account/support files matched. Verified targets: cash 19,999; checking 1,999,999; Family Savings 1,000,000. The maintainer supplied an in-game cash/checking screenshot and then confirmed the requested savings/save/reload checks. Browser profile Swap Endian was used after confirming byte-order reversal. The encrypted SAVEDATASARC0011 container, not decrypted SARC0011, is required for transfer. This supersedes the temporary blanket restoration warning, not the historical record of earlier failures. The precise cause of each earlier failed attempt is not established. Coverage remains one tested PS5 save/console; no general Xbox money editing or universal compatibility claim.

## Experimental stash preview — 0.5.0-stash-preview.1

This separate prerelease adds **Bed stash** handling for supported decoded early-game layouts. It is not stash gameplay-validated. Keep the previously tested 0.4 beta available for bank-era workflows.

The selected stash must have a unique registered container relationship and a uniquely corroborated character-statistic relationship. Cash is separate; if no cash wallet exists its field stays disabled and zero. Checking and Family Savings remain read-only whenever the experimental stash profile is active—even if those accounts already exist. The profile is selected by structure, never chapter number.

Stash edits use a conservative 20,000 policy ceiling (or the current original amount if higher, without further increases). This is NOT a discovered stash capacity. Only matching current combined-money mirrors are updated; stale unmatched records are preserved. Unsupported/ambiguous layouts remain blocked. No wallet/container creation occurs in this profile.

Local GarlicMgr can export a PS5-decrypted container whose game file still begins with ASAV. This editor now explains that second layer rather than treating it as JSAV. The tested website route can supply JSAV, but users must consent to third-party processing. No private decoder/game inputs are included or automatically downloaded. Decoding ASAV alone does not guarantee a supported edit layout.

Nested exports such as PPSAxxxxx/sdimg_SAVEDATASARC0000/SARC0000 are recognized. On ZIP export the leading title-ID folder is removed for the browser handoff; save-relative content and support files are preserved. Raw JSAV exports alone still lack the support metadata needed for website encryption.

Tests: 70 automated checks total, including six new stash/error cases. Six privately held decoded samples passed experimental decrease/reparse and exact no-op checks; originals were not modified or uploaded. In-game stash load/save/reload acceptance remains REQUIRED before claiming supported gameplay. No private saves, identifiers or sample hashes are published.
