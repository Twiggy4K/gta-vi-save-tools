# Experimental decoded-save editor

Run Start-Editor.cmd with Node.js 22+ installed. This component needs no game executable, private tables, account credentials or maintainer save. It edits already decoded JSAV locally and writes separate outputs. It does NOT produce a restore-ready ASAV or encrypted PS5 container by itself.

Full guide: ../docs/DECODED-EDITOR-GUIDE.md.

Policy limits: selected wallet cash 0–20,000; shared checking 0–2,000,000; Family Savings 0–1,000,000. These are editor policies, not proven universal game ceilings.

Accounts are discovered by item/root/parent relationships across inventories, not fixed positions, row counts, character codes or an original balance. The wallet is corroborated with statistic and ledger relationships. Unknown or ambiguous layouts refuse edits. Unknown capacity is never increased beyond its currently observed quantity; mapped containers provide additional capacity. Existing bank mirrors may describe a unique container subset rather than the full account; the writer preserves uniquely corroborated scopes. This is an experimental inference, not universal proof of gameplay semantics.

No full private sample or account identity is included. Every user must supply their own correctly decoded save and matching metadata. ZIP packaging preserves that user's original export and replaces only the selected game file. Such output is private and should not be posted publicly.

Browser processing is manual: sign in to GarlicSaves, upload your own ZIP, and compare a decrypted return in the editor. No key prompt, automatic upload or verified-container-path claim remains. One controlled PS5 website-path load/save/reload test passed.

The older workshop local-ASAV path still needs undistributed runtime inputs. That does not affect this decoded writer, but means this is not a self-contained protected-ASAV codec release.

### Portable Windows download (0.3.1-alpha.1)

Choose **Windows-x64-Portable.zip** in Releases, use Extract All, and double-click **Start-Editor.cmd**. Keep its runtime folder alongside the editor. Node.js 24.22.3 and its license notices are included; no separate installation or Codex subscription is needed. The source-only download still requires Node.js 22+. Other workflow and experimental limitations remain unchanged.

### 0.3.2 browser handoff correction

The public UI no longer requests worker/API keys or directs users to Contribute. **Open GarlicSaves** opens the normal Encrypt page for manual sign-in/upload. One controlled PS5 website-path load/save/reload test passed. Historical API tests are separate. Source-only developer API helpers remain experimental and are not required by the UI.

### Website account-profile selection

Before encrypting, add/save the profile offered when decrypting the original console export, and select the corresponding profile on Encrypt. Do not assume a previously stored profile is correct. Byte-reversed duplicate profiles occurred in testing; stop on mismatched account metadata rather than guessing. Follow the profile troubleshooting and exact-download round-trip steps in [the guide](../docs/DECODED-EDITOR-GUIDE.md). The controlled PS5 browser-path test also passed in-game loading and user-reported save/reload persistence.

**Website profile warning:** Add to profile may save the ID in reversed byte order. Compare with the original decrypt job; use Dashboard → profile three-dot menu → **Swap Endian** only when that specific reversal is confirmed. Re-encrypt and verify a decrypted return. See the detailed guide; this was not observed as necessary in our local GarlicMgr tests.

## Experimental stash preview — 0.5.0-stash-preview.1

This separate prerelease adds **Bed stash** handling for supported decoded early-game layouts. It is not stash gameplay-validated. Keep the previously tested 0.4 beta available for bank-era workflows.

The selected stash must have a unique registered container relationship and a uniquely corroborated character-statistic relationship. Cash is separate; if no cash wallet exists its field stays disabled and zero. Checking and Family Savings remain read-only whenever the experimental stash profile is active—even if those accounts already exist. The profile is selected by structure, never chapter number.

Stash edits use a conservative 20,000 policy ceiling (or the current original amount if higher, without further increases). This is NOT a discovered stash capacity. Only matching current combined-money mirrors are updated; stale unmatched records are preserved. Unsupported/ambiguous layouts remain blocked. No wallet/container creation occurs in this profile.

Local GarlicMgr can export a PS5-decrypted container whose game file still begins with ASAV. This editor now explains that second layer rather than treating it as JSAV. The tested website route can supply JSAV, but users must consent to third-party processing. No private decoder/game inputs are included or automatically downloaded. Decoding ASAV alone does not guarantee a supported edit layout.

Nested exports such as PPSAxxxxx/sdimg_SAVEDATASARC0000/SARC0000 are recognized. On ZIP export the leading title-ID folder is removed for the browser handoff; save-relative content and support files are preserved. Raw JSAV exports alone still lack the support metadata needed for website encryption.

Tests: 70 automated checks total, including six new stash/error cases. Six privately held decoded samples passed experimental decrease/reparse and exact no-op checks; originals were not modified or uploaded. In-game stash load/save/reload acceptance remains REQUIRED before claiming supported gameplay. No private saves, identifiers or sample hashes are published.
