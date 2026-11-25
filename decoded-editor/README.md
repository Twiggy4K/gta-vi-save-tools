# Experimental decoded-save editor

Run Start-Editor.cmd with Node.js 22+ installed. This component needs no game executable, private tables, account credentials or maintainer save. It edits already decoded JSAV locally and writes separate outputs. It does NOT produce a restore-ready ASAV or encrypted PS5 container by itself.

Full guide: ../docs/DECODED-EDITOR-GUIDE.md.

Policy limits: selected wallet cash 0–20,000; shared checking 0–2,000,000; Family Savings 0–1,000,000. These are editor policies, not proven universal game ceilings.

Accounts are discovered by item/root/parent relationships across inventories, not fixed positions, row counts, character codes or an original balance. The wallet is corroborated with statistic and ledger relationships. Unknown or ambiguous layouts refuse edits. Unknown capacity is never increased beyond its currently observed quantity; mapped containers provide additional capacity. Existing bank mirrors may describe a unique container subset rather than the full account; the writer preserves uniquely corroborated scopes. This is an experimental inference, not universal proof of gameplay semantics.

No full private sample or account identity is included. Every user must supply their own correctly decoded save and matching metadata. ZIP packaging preserves that user's original export and replaces only the selected game file. Such output is private and should not be posted publicly.

Optional online processing is a separate, consent-based route. The UI asks for the user's own worker/API key and explicit approval before uploading to GarlicSaves. It encrypts, re-decrypts a copy, and checks exact edited game data and unchanged account/support files before exposing a verified container path. A consented live encrypt/decrypt verification passed on one private source; no new retail restoration test was performed. No public/shared credential is embedded.

The older workshop local-ASAV path still needs undistributed runtime inputs. That does not affect this decoded writer, but means this is not a self-contained protected-ASAV codec release.

### Portable Windows download (0.3.1-alpha.1)

Choose **Windows-x64-Portable.zip** in Releases, use Extract All, and double-click **Start-Editor.cmd**. Keep its runtime folder alongside the editor. Node.js 24.22.3 and its license notices are included; no separate installation or Codex subscription is needed. The source-only download still requires Node.js 22+. Other workflow and experimental limitations remain unchanged.
