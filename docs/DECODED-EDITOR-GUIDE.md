# Decoded save editor: step by step

## What this download does

It changes supported money structures in an already decoded save, entirely on your PC. The Windows x64 portable download includes Node.js. No separate Node installation, game executable or private research files are needed. Source-only downloads require Node.js 22+.

**The exported JSAV/ZIP is not ready to restore to your PS5.** Game-level encoding and PlayStation container encryption remain separate. A processing service must explicitly support the decoded format. The optional online route passed one consented live encrypt/decrypt verification, including original account metadata. That is not a new gameplay/restoration test.

## Open and inspect

1. Extract the editor ZIP with Windows Extract All. Keep all files together.
2. For Windows x64, use the **Portable** download: Node.js is included. Source-only downloads require Node.js 22+.
3. Open Start-Editor.cmd in the top folder.
4. Click **1 Open decoded save / ZIP**. Select your own decoded JSAV file or a decrypted ZIP containing decoded SARC entries. ASAV game files and encrypted console images are not decoded JSAV.
5. If the ZIP contains multiple slots, select the one you intend to edit. No slot number is hardcoded.
6. Review the original balances and wallet choices. Inventory labels are not protagonist names. Choose the wallet whose cash and state match the save you intend to edit.
7. If the app reports ambiguous ownership, missing ledger/history or unmatched mirrors, stop and submit a privacy-filtered checker report. Do not guess a character code. Some saves are still unsupported.

The app backs up the selected input. It does not need the maintainer's save, original balance or account identity. Statistics are compared against the CURRENT input as corroboration, not against a fixed personal fixture.

## Edit and export

1. Set cash from **0 to 20,000**, checking from **0 to 2,000,000**, and savings from **0 to 1,000,000**.
2. Click **2 Review + export decoded edit**.
3. Review all three requested amounts and confirm.
4. Open the output folder. It contains a copy of your original decoded input, the edited decoded file and a local change manifest. If you opened a ZIP, it also contains **edited-decoded-save.zip** with only the selected game entry replaced.
5. Keep these outputs private: the ZIP preserves your own account metadata and sidecars from the input. Never upload someone else's export or substitute unrelated metadata.

The writer verifies the edited document and related money structures. It appends registered mapped-capacity currency rows when needed, preserving exact original GUID tokens and unrelated fields. It does not silently overfill unknown boxes. Ambiguity causes rejection. No changes are written to the source or a console.

## Optional browser processing

1. Export from your complete original decoded ZIP.
2. Click **3 Open GarlicSaves**. Sign in on the website, never in this editor. No worker key is needed by this handoff.
3. The editor highlights **edited-decoded-save.zip**. Upload manually on the site's Encrypt page only if it supports this decoded format; keep the original account/profile.
4. Download the encrypted result. Decrypt a copy using the website.
5. Click **4 Check decrypted return ZIP** and select that decrypted download. Every file must match the intended package exactly. A mismatch blocks approval. Keep the encrypted result paired with its verification download.

**Browser encryption compatibility is pending an end-to-end test.** Earlier successful worker-API tests do not establish ordinary website behavior. A matching decrypted ZIP proves content equality, not which encrypted file was transferred or gameplay acceptance. No files are uploaded by the editor and no console restoration occurs. Website uploads share game/account metadata with that service. If the site rejects the export, stop; do not rename or force it.

## What remains experimental

The writer now avoids fixed inventory positions and original balances, but game semantics can differ by build and progression. The recognized item/slot specifications are not a proof that every save is supported. Reported PS5 gameplay tests and external Xbox-derived PC load/save/reload tests were conducted on specific earlier cases; they are not gameplay acceptance of this new generalized writer on everyone's saves.

The conservative 2M checking and 1M savings caps are editor policies. We are not raising them based on screenshots alone. The local protected-ASAV codec still requires private runtime material; only the decoded writer is independent of those inputs today.

### Portable Windows download (0.3.1-alpha.1)

Choose **Windows-x64-Portable.zip** in Releases, use Extract All, and double-click **Start-Editor.cmd**. Keep its runtime folder alongside the editor. Node.js 24.22.3 and its license notices are included; no separate installation or Codex subscription is needed. The source-only download still requires Node.js 22+. Other workflow and experimental limitations remain unchanged.

### 0.3.2 browser handoff correction

The public UI no longer requests worker/API keys or directs users to Contribute. **Open GarlicSaves** opens the normal Encrypt page for manual sign-in/upload. Browser end-to-end compatibility remains unverified. Historical API tests are separate. Source-only developer API helpers remain experimental and are not required by the UI.
