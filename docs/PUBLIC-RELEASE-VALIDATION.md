# Public prerelease validation — 2026-11-25

Candidate: source v0.2.0-alpha.1, checker v0.1.1.

- Source allowlist audit passed without private assets or machine-specific configuration.
- 34 reconstruction synthetic tests and 12 checker tests passed (46 total).
- Windows PowerShell syntax checks passed for checker, workshop and packaging scripts.
- The Windows checker ZIP was extracted into a fresh test directory. Using Node from PATH, it inspected synthetic raw JSAV and ZIP inputs without private configuration or the research workspace.
- Saving a report over the input was rejected. Existing report files were also protected. Report output excluded synthetic account/path/GUID canaries. Input hashes stayed unchanged.
- Checker input bounds were tightened to 8 MiB per decoded slot and 128 MiB combined candidate ZIP data. Oversized and unsupported-version rejection tests passed.
- Release artifacts are built from explicit allowlists. No runtime binary, save, account metadata, key, private configuration or original research Git history is packaged.

The GUI/extraction checks were local Windows tests. Linux CI runs source-only synthetic checks, not GUI, private game data or console tests. Historical private integration evidence and externally reported gameplay tests are described separately in VALIDATION.md and CROSS-PLATFORM-TEST.md.

The release does not claim an independently runnable full editor. Workshop code is profile-specific experimental source requiring undistributed private inputs. No public sample or port is included.
