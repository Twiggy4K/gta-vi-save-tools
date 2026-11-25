# Local setup

This page is for developer/runtime setup. For ordinary use, follow the **[plain-language user guide](USER-GUIDE.md)** instead. The read-only checker instructions are in Part A; supported workshop tests are in Part B.

## Read-only checker

Install Node.js 18+ and launch `checker/Start-Checker.cmd` on Windows. Open decoded JSAV files or supported ZIPs with decoded SARC entries. Raw PS5 containers and ASAV game bodies are intentionally unsupported here. The checker does not depend on private codec inputs and never approves restoration. Read `checker/README.md` before selected testing.

## Repository checks

Node.js 22+, no npm dependencies: `npm run audit:source` and `npm test`. CI uses synthetic fixtures only.

## Workshop source snapshot

The archived workshop needs Windows PowerShell/Windows Forms, Node.js, Python/WSL and separately held private analysis inputs. It is not a standalone public download. The private local working installation remains separate and was not modified by this repository cleanup.

In a separate private runtime installation, the reconstruction expects:

```text
research/private-inputs/game_scarlett_master.exe
research/private-listings/outer-model-disassembly.txt
research/private-listings/outer-pack-disassembly.txt
research/private-listings/digest-state-output-disassembly.txt
```

Never add these to the source checkout. The source audit rejects such material even when Git ignores it. Fingerprint-pinned inputs and reviewed listings are required; arbitrary substitutes are unsupported.

Launch `workshop/Start-Editor.cmd` only in a prepared private runtime. An optional ignored `workshop/node-runtime.json` can specify a local nodePath. Choose the matching complete local decrypted export, then open the web-decoded slot-10 ZIP containing JSAV and its chives.dat original-body sidecar. Input body matching prevents mixing saves with unrelated metadata.

The app backs up inputs and builds unique private outputs. Optional local GarlicMgr encryption accepts an explicitly entered private LAN address, retains the original account, and re-decrypts a copy to verify the game file and sce_sys files. The verified extensionless container is the replacement input to GarlicTransfer; do not select its ZIP as a raw replacement.

Retail download and restoration remain manual. Verify actual Library, Upload and metadata paths use the intended working profile, preserve full recovery copies, pause cloud auto-sync while testing, and manually load the edited slot rather than the autosave. Upload can operate at whole-game entry granularity and may require deleting destination saves; do not assume a one-slot deletion UI.

## Historical prototype

`editor/` is the preserved statistic-only cash candidate prototype. Its old field-only outputs were locally valid but were not the inventory-consistent method later accepted by the game. It is retained for research history, not recommended restoration.
