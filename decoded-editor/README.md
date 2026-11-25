# Experimental decoded-save editor

Run Start-Editor.cmd with Node.js 22+ installed. This component needs no game executable, private tables, account credentials or maintainer save. It edits already decoded JSAV locally and writes separate outputs. It does NOT produce a restore-ready ASAV or encrypted PS5 container by itself.

Full guide: ../docs/DECODED-EDITOR-GUIDE.md.

Policy limits: selected wallet cash 0–20,000; shared checking 0–2,000,000; Family Savings 0–1,000,000. These are editor policies, not proven universal game ceilings.

Accounts are discovered by item/root/parent relationships across inventories, not fixed positions, row counts, character codes or an original balance. The wallet is corroborated with statistic and ledger relationships. Unknown or ambiguous layouts refuse edits. Unknown capacity is never increased beyond its currently observed quantity; mapped containers provide additional capacity. Existing bank mirrors may describe a unique container subset rather than the full account; the writer preserves uniquely corroborated scopes. This is an experimental inference, not universal proof of gameplay semantics.

No full private sample or account identity is included. Every user must supply their own correctly decoded save and matching metadata. ZIP packaging preserves that user's original export and replaces only the selected game file. Such output is private and should not be posted publicly.

Browser processing is manual: sign in to GarlicSaves, upload your own ZIP, and compare a decrypted return in the editor. No key prompt, automatic upload or verified-container-path claim remains. Ordinary website compatibility is pending an end-to-end test.

The older workshop local-ASAV path still needs undistributed runtime inputs. That does not affect this decoded writer, but means this is not a self-contained protected-ASAV codec release.

### Portable Windows download (0.3.1-alpha.1)

Choose **Windows-x64-Portable.zip** in Releases, use Extract All, and double-click **Start-Editor.cmd**. Keep its runtime folder alongside the editor. Node.js 24.22.3 and its license notices are included; no separate installation or Codex subscription is needed. The source-only download still requires Node.js 22+. Other workflow and experimental limitations remain unchanged.

### 0.3.2 browser handoff correction

The public UI no longer requests worker/API keys or directs users to Contribute. **Open GarlicSaves** opens the normal Encrypt page for manual sign-in/upload. Browser end-to-end compatibility remains unverified. Historical API tests are separate. Source-only developer API helpers remain experimental and are not required by the UI.

### Website account-profile selection

Before encrypting, add/save the profile offered when decrypting the original console export, and select the corresponding profile on Encrypt. Do not assume a previously stored profile is correct. Byte-reversed duplicate profiles occurred in testing; stop on mismatched account metadata rather than guessing. Follow the profile troubleshooting and exact-download round-trip steps in [the guide](../docs/DECODED-EDITOR-GUIDE.md). A single browser round trip passed content/account checks; gameplay testing remains separate.
