# Decoded save editor: step by step

## What this download does

It changes supported money structures in an already decoded save, entirely on your PC. It needs Windows and Node.js 22+, but no game executable or private research files.

**The exported JSAV/ZIP is not ready to restore to your PS5.** Game-level encoding and PlayStation container encryption remain separate. A processing service must explicitly support the decoded format. The optional online route passed one consented live encrypt/decrypt verification, including original account metadata. That is not a new gameplay/restoration test.

## Open and inspect

1. Extract the editor ZIP with Windows Extract All. Keep all files together.
2. Install Node.js 22 or newer from nodejs.org if needed.
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

## Optional online processing

After exporting from a complete original single-slot GarlicSaves decoded ZIP:

1. Click **3 Online encrypt + verify**.
2. Enter your own GarlicSaves worker/API key. This is not your PSN password. Use **Get my service key** to open the service's Contribute page if needed. A service account/key and availability are external requirements; no shared credential is bundled.
3. Read the disclosure and check the approval box. Your save and account metadata will be sent to that third party for encryption and verification decryption. No upload happens without your approval, and the key is not stored by the app.
4. Wait for **VERIFIED**. The editor re-decrypts a copy of the returned container, compares its decoded game data with the intended edit, and checks original SFO/account, keystone and icon bytes. If anything differs, it refuses verification.
5. Click **Copy verified container path** and use that extensionless file in GarlicTransfer's local replacement action. Do not choose the ZIP. Console restoration is still a separate, deliberate action.

Online processing requires the complete ORIGINAL single-slot web export and its matching metadata, not a raw JSAV alone or a multi-slot archive. The developer adapter reads the account wire bytes from the original SFO; it does not ask you to type an account ID. A live test exposed a byte-order mismatch; verification caught it, and the corrected path preserved metadata byte-for-byte. The account-byte convention is service-specific, so return-file verification must never be skipped.

A user-approved live test passed with cash 20,000, checking 2M and savings 1M. The result was not restored. The worker API is a third-party dependency that can change or be unavailable; a successful test on one input is not universal service compatibility. No private codec or game executable is required by this online route.
Before ANY restoration test: verify the processed file by decrypting a copy through a compatible path, compare the recovered decoded content to the intended edit, confirm the original account metadata, keep full local/cloud recovery copies, and review the actual transfer/deletion scope. Do not restore just because encryption returned a file.

## What remains experimental

The writer now avoids fixed inventory positions and original balances, but game semantics can differ by build and progression. The recognized item/slot specifications are not a proof that every save is supported. Reported PS5 gameplay tests and external Xbox-derived PC load/save/reload tests were conducted on specific earlier cases; they are not gameplay acceptance of this new generalized writer on everyone's saves.

The conservative 2M checking and 1M savings caps are editor policies. We are not raising them based on screenshots alone. The local protected-ASAV codec still requires private runtime material; only the decoded writer is independent of those inputs today.
