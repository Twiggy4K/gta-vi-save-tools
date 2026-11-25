> **PS5 workflow validated on one tested save — 2026-11-25:** The maintainer confirmed the public decoded editor → GarlicSaves website encryption → GarlicTransfer workflow loaded the intended balances in-game and preserved them after saving and reloading. This is one-console/sample evidence, not universal compatibility. Keep untouched backups and verify every return.

# Decoded save editor: step by step

## What this download does

It changes supported money structures in an already decoded save, entirely on your PC. The Windows x64 portable download includes Node.js. No separate Node installation, game executable or private research files are needed. Source-only downloads require Node.js 22+.

**The exported JSAV/ZIP is not ready to restore to your PS5.** Game-level encoding and PlayStation container encryption remain separate. A processing service must explicitly support the decoded format. The optional online route passed one consented live encrypt/decrypt verification, including original account metadata. A subsequent controlled browser-path PS5 test loaded the intended balances and preserved them after saving and reloading.

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

1. Decrypt your **original console export** on GarlicSaves. Download and keep that original decrypted ZIP untouched.
2. If the decrypt result offers to add/save its account profile, complete that step, then compare the saved profile ID with the original decrypt job display. The website may reverse its byte order; follow **Website profile ID order: Swap Endian** below before encrypting.
3. Open that complete original decoded ZIP in our editor. Review the slot/wallet, edit balances and export.
4. Click **3 Open GarlicSaves**. Sign in on the website, never in this editor. No worker key is needed. The editor highlights **edited-decoded-save.zip**.
5. On the website's Encrypt page, select the profile associated with the **original console save**, then upload the edited ZIP. Do not select a profile created only by decrypting an earlier incorrectly encrypted test.
6. Download the encrypted result into a separate attempt folder. Decrypt a copy of **that exact download** and save its returned ZIP beside it. Do not reuse an older decrypted download.
7. Click **4 Check decrypted return ZIP** in the same editor session. Select the new decrypted download. The game file and original account/support files must match. Only the known outer-folder prefix and regenerated chives sidecars may differ.
8. If the comparison passes, keep that encrypted/decrypted pair together for your deliberate GarlicTransfer test. A pass does not prove gameplay acceptance or verify which file you transfer.

### If profiles appear duplicated or verification fails

Our browser test produced two profiles whose account IDs were byte-reversed versions of each other. Selecting one changed the original ACCOUNT_ID bytes; selecting the other preserved them. This is an observed format/profile ambiguity, **not proof that the user made a mistake**. Do not guess, reverse an ID manually, or choose by a profile name's suffix. Stop on an account mismatch and compare against the original save's indexed ACCOUNT_ID field before retrying. Never restore the rejected container. Preserve your untouched local/cloud backups while cleaning up test downloads.

A browser encrypt/decrypt round trip has now preserved the intended game data, original param.sfo, keystone and icon on one tested slot. Folder names and processing sidecars changed. This is one tested case; subsequent gameplay loading/save/reload was confirmed for that case, not universal compatibility. The editor performs no upload or console restoration; manual website uploads share game/account metadata with that service.

## What remains experimental

The writer now avoids fixed inventory positions and original balances, but game semantics can differ by build and progression. The recognized item/slot specifications are not a proof that every save is supported. Reported PS5 gameplay tests and external Xbox-derived PC load/save/reload tests were conducted on specific earlier cases; the newly confirmed generalized browser-path result covers one PS5 save, not everyone's saves.

The conservative 2M checking and 1M savings caps are editor policies. We are not raising them based on screenshots alone. The local protected-ASAV codec still requires private runtime material; only the decoded writer is independent of those inputs today.

### Portable Windows download (0.3.1-alpha.1)

Choose **Windows-x64-Portable.zip** in Releases, use Extract All, and double-click **Start-Editor.cmd**. Keep its runtime folder alongside the editor. Node.js 24.22.3 and its license notices are included; no separate installation or Codex subscription is needed. The source-only download still requires Node.js 22+. Other workflow and experimental limitations remain unchanged.

### 0.3.2 browser handoff correction

The public UI no longer requests worker/API keys or directs users to Contribute. **Open GarlicSaves** opens the normal Encrypt page for manual sign-in/upload. The controlled browser-path PS5 test subsequently passed loading and user-reported save/reload persistence. Historical API tests are separate. Source-only developer API helpers remain experimental and are not required by the UI.

### Website profile ID order: Swap Endian

In our tested GarlicSaves website workflow, **Add to profile** stored the account ID in the opposite byte order from the decrypt job's displayed account ID. Encryption then showed different **Previous Account ID** and **New Account ID** values, and the returned account metadata failed comparison.

If this happens:

1. Keep the original decrypt job open and note its displayed Account ID privately. Never post your ID in an issue or screenshot.
2. On the website Dashboard, compare the saved profile's actual ID with that original decrypt result. Profile names can stay unchanged after corrections, so do not rely on the name.
3. **Only if the mismatch is the reversed byte order**, open the profile's three-dot menu and choose **Swap Endian** once. This changes the stored profile, not just its label. Do not toggle it routinely or when IDs already agree. It will also affect future jobs using that profile.
4. Return to Encrypt, refresh if needed, select the corrected profile and upload the editor's **edited-decoded-save.zip**, not your original decrypted ZIP.
5. For a same-account edit, the completed job's **Previous Account ID** and **New Account ID** should agree. If they differ, stop.
6. Download the encrypted result, decrypt a copy of that exact download, and run **Check decrypted return ZIP**. Require a pass before any restoration test; matching displayed IDs alone is insufficient.

After this correction, our tested browser round trip passed the editor's game-data and original account/support comparison. The subsequent controlled gameplay test passed; this does not establish universal website behavior or acceptance of other saves. We did **not** observe this correction being necessary in our earlier local, jailbroken-PS5 GarlicMgr workflow. Do not apply a website-profile workaround automatically to local GarlicMgr.

## Transfer the correct file and test persistence

1. Keep untouched console/cloud backups. Use separate **Original**, **Edited**, **Encrypted**, and **Verification** folders for each attempt.
2. Confirm the editor export actually has the intended new balances. A no-op export changes nothing.
3. After the decrypted-return comparison passes, extract the encrypted website download from **Encrypted**.
4. In GarlicTransfer, select the intended save slot, choose **Replace with another save**, and select the extensionless **SAVEDATASARC0011** encrypted container (slot 11 example). **SARC0011** from a decrypted ZIP is the game file and is NOT the transfer container. Do not select a decrypted ZIP or files from Verification.
5. Review the target console/profile and upload scope before uploading. GarlicTransfer can replace existing saves; retain all backups.
6. Manually load the intended slot in-game rather than its autosave. Confirm cash, shared checking and Family Savings. Save separately, reload, and confirm persistence.
7. If loading or balances fail, stop; retain all paired files for diagnosis and use your known-good recovery copy. A checker pass is not a guarantee of game acceptance.

### Completed controlled acceptance test

The confirmed target was 19,999 cash, 1,999,999 shared checking and 1,000,000 Family Savings. The screenshot shows cash/checking in-game, and the maintainer subsequently confirmed the requested savings/save/reload checks. This is maintainer-reported gameplay evidence; automated checks independently verified the returned game data and original account/support files. No additional volunteers or universal game-version coverage are implied. Earlier load failures occurred during a confused sequence of game-file/container selection and no-op exports; the exact cause of every earlier failure is not established. They remain in the historical log, superseded by the successful controlled attempt.
