# Start here: a plain-language guide

**New decoded-writer preview:** follow [this guide](DECODED-EDITOR-GUIDE.md) to edit decoded saves locally without private codec inputs. The older local-ASAV workflow in Part B below remains a separate private-runtime path.

This guide covers these two workflows:

| What you want to do | Tool to use | Available to whom? |
|---|---|---|
| Check whether a save has a layout we recognize | **Read-only compatibility checker** | Public checker users |
| Change money in a supported save | **Local Save Workshop** | Selected users with an explicitly supported save and a prepared installation |

**Downloading this repository does not give you a ready-to-use universal save editor.** The workshop still requires private research inputs that are not included. Do not spend time looking for missing game files or trying random downloads to make it launch. If you were invited to test, the maintainer will tell you which tool and setup apply to you.

The read-only checker does not have that private-input requirement. You can inspect a suitable decoded save without changing it. A successful inspection does **not** mean an edit is approved.

## Part A — Run the read-only checker

### 1. Get the checker

Use the checker ZIP from the repository's Releases page. In Windows, right-click the ZIP and choose **Extract All**. Open the extracted folder.

Do not run the launcher from inside the ZIP. Keep the files together: the launcher needs the other files beside it.

If you are using the source repository instead, the checker is in the **checker** folder. Do not open **editor**, which contains an older research prototype.

### 2. Make sure Node.js is installed

Node.js is the small program that runs the checker behind the window. The current checker needs version 22 or newer.

If the checker says **Runtime required**, install a supported Windows version of Node.js from the [official Node.js site](https://nodejs.org/), then reopen the checker. You do not need to install programming packages or type npm commands just to run it.

If you are not sure whether Node.js is already installed, try the next step first. A missing-runtime message does not mean your save is damaged.

### 3. Open the checker

Double-click **Start-Checker.cmd**. A window titled **GTA VI | Read-only Compatibility Check** should open.

This tool does not connect to your PS5, upload anything, edit your save or restore it. You do not need to turn your console on just to inspect an existing decoded file.

If Windows or your security software blocks the tool, stop and contact the maintainer. Do not disable your protection simply to continue.

### 4. Choose the right input

Click **Open decoded save or ZIP**.

Choose either:

- A game save that has already been decoded into **JSAV** form; or
- A decrypted ZIP containing SARC save files that are already decoded into JSAV form.

You do not have to open a hex editor to identify the format. The checker will tell you if it cannot inspect it.

**Important:** "Decrypted" can mean different things. Some exports unlock the PS5 container but leave the game's own data encoded. A local GarlicMgr export can therefore still contain an **ASAV** game file, which this standalone checker cannot decode. An encrypted PS5 save container is also not a suitable input.

If all you have is an encrypted backup or an ASAV export, stop here and tell the maintainer what kind of export you have. The checker does not include the downloading/decryption process. Do not upload private saves to an online service merely to get past this step without deciding whether you are comfortable sharing them with that service.

### 5. Read the result

For a readable save, the window shows recognized account balances, unassigned wallet candidates and a report preview.

| Result | Plain-language meaning | What to do |
|---|---|---|
| **inspectable** | We can read the structure and report what we found | Compare the reported amounts with your game, then share the report privately |
| **unrecognized** | The document is readable, but the expected inventory layout was not found | Send the report; do not try an edit |
| **inconsistent** | Some relationships or arithmetic did not pass the checks | Send the report; do not restore modified files |
| **unsupported** | The file is encoded, damaged, too large or a format this checker cannot read | Check the input type; ask the maintainer if unsure |

An **unassigned wallet candidate** means the checker found a possible cash wallet but does not know which protagonist owns it. Do not assume inventory 0 or inventory 1 always means a particular character.

These results are research findings, not a green light to edit or restore a save.

### 6. Save and share the report

Click **Save shareable report**, choose a folder you can find again and save the JSON report. You can send this file to the maintainer without understanding the technical fields inside it.

Before sending, review the preview. The report includes gameplay balances and structure counts. It deliberately excludes account IDs, exact item GUIDs, keys, source paths and original save contents. This is still information about your game progress; it is not a promise of anonymity.

Alongside the report, send:

- Your **game version**, if known. This is different from your PS5 system-software version.
- Which character you had active when you saved.
- Your approximate campaign stage, without story spoilers if you prefer.
- The cash, checking and Family Savings amounts shown in that same save.
- Whether it is a manual save or an autosave, if known.

Please do **not** send PSN passwords, account IDs, keys or your entire console backup. Reports come first. If the maintainer later needs a private sample, agree separately on exactly what is needed and how to send it.

## Part B — Edit a supported save in the Local Save Workshop

**Use this section only after the maintainer has confirmed your save layout is supported and your private workshop installation is ready.** The current writer was developed for a particular mapped slot-10 profile. The checker cannot automatically grant write support to another save.

### 1. Prepare recovery copies

Close GTA VI before transferring saves. Preserve a full, untouched local backup of the game's saves, including its transfer metadata. Keep any cloud recovery copy separate and pause automatic cloud synchronization while testing so a test save does not silently replace it.

Make a separate **working copy** of the downloaded profile for GarlicTransfer. Editing and importing should use that copy, not your only backup. A cloud copy alone is not a substitute for a verified local recovery copy.

### 2. Gather the two matching exports

The current workshop needs both exports from the **same original save**:

1. The decoded save ZIP containing the supported SARC file and **chives.dat**.
2. A complete local GarlicMgr export containing the original **PS5IMAGE**, **PS5KEY**, **PS5PARAM_SIZE**, **chives.json** and supporting **sce_sys** files.

You do not need to rename, unpack or combine those files manually. The workshop handles packaging and checks that the two exports belong together. Do not substitute an image from another slot or an older save.

These sidecars can contain sensitive material. Keep the exports private.

### 3. Open the workshop and load the save

Open **workshop/Start-Editor.cmd** in the prepared installation. The window is titled **GTA VI | Local Save Workshop**.

For the repository's prepared-installation version:

1. Click **Choose matching local export** and select the complete local decrypted ZIP.
2. Click **1 Open save ZIP** and select the matching decoded save ZIP.
3. Wait for validation to finish.
4. Check the displayed original balances against the save you intend to edit.

The workshop makes verified backup copies when it opens the input. A mismatch or unsupported layout should stop the process. Do not force a different save through the checks.

An older local development installation may already have its supporting export configured. That is a convenience of that installation, not something supplied in the source repository.

### 4. Choose your balances

Enter the amounts you want in the three controls:

- **Jason cash on hand** — the wallet mapped in the current profile.
- **Shared checking** — the bank account shared between characters.
- **Shared Family Savings** — the shared savings account.

The current controls allow up to 20,000 cash, 2,000,000 checking and 1,000,000 savings. These are editor policies, not a proven list of every game limit. They do not automatically grant every bank-tier perk or establish the other character's wallet mapping.

Click **2 Review + build package**. Check all three numbers in the confirmation window before choosing **OK**. This creates separate PC files. It does not restore anything to the console.

Changing any amount afterward means you must build a new package. Do not reuse an older output by mistake.

### 5. Encrypt and check the result locally

Open Garlic Save Manager on the separate modded PS5 used for processing. Keep it running.

In the workshop, enter the local HTTP address GarlicMgr displays. This is the modded processing console's address, not the retail console you play on. The source repository deliberately supplies no default console address.

Click **3 Encrypt locally + verify** and read the confirmation. If the destination is correct, choose **OK**.

The workshop will:

1. Send a copy of the prepared package to that local console without changing the account binding.
2. Download the encrypted result.
3. Decrypt a copy of the result for checking.
4. Compare its game file and supporting files with the intended edit.
5. Enable **Copy verified container path** only after the checks pass.

Wait for **VERIFIED** and check the displayed balances. This means the processing round trip passed. It does not yet prove the game will accept an unfamiliar save layout.

If you see **NOT VERIFIED**, do not upload the result. Keep the error message and ask for help. A failed attempt can leave diagnostic output files, but their existence is not proof they are ready to restore.

### 6. Replace the PC working copy in GarlicTransfer

Click **Copy verified container path**. This copies the path to the exact encrypted file to import.

In GarlicTransfer:

1. Open **Settings** and verify that **Console profile root folder**, **Upload save folder** and any selected **metadata.db** all point to the intended working profile.
2. Save the settings, return to **Library** and click **Refresh**.
3. Choose the correct console profile, game and target save slot.
4. Open **More → Replace with another save…**.
5. Paste the copied path into the file picker's **File name** box and click **Open**.
6. Confirm replacement only after checking that the target is the PC working copy.

**Select the extensionless encrypted container, not a ZIP.** Accepting a ZIP in this picker does not mean GarlicTransfer extracts it. If the file list looks empty, paste the full path into **File name**, or choose **All files** if available.

The replacement confirmation updates the PC file and its transfer metadata. It is not yet a console restoration.

### 7. Review the upload before changing console data

Select **Upload to PS5** or open **Upload → Prepare Upload**, depending on the app version. Verify the destination console and user.

The upload list may show the **whole GTA VI entry**, including multiple save files, rather than only the edited slot. Check that all other files in that working profile are the intended originals. Do not assume only one slot will be affected.

GarlicTransfer's upload procedure can require deleting the selected original data on the destination console. PS5 may offer deletion for the entire game's save set. **Do not confirm deletion unless you have verified your complete recovery copies and understand the exact scope.** If the prompt differs from the reviewed closed-test procedure, stop and ask before proceeding.

Once that step is reviewed, follow GarlicTransfer's instructions. Its documented console route is **Settings → System → System Software → Data Transfer**, then **Continue**, choose **GarlicTransfer**, and start the transfer. Follow the actual app's prompts if the version differs. Do not power off the destination console to imitate the source-console power-button signal; GarlicTransfer handles that signal during upload.

### 8. Load the correct save and test persistence

Open GTA VI and **manually load the edited slot**. Do not use Continue unless you have verified it selects that slot. Our first apparent failure was simply loading the unchanged autosave.

Check all three balances. Then, when appropriate for your test:

1. Make a small purchase or bank transaction.
2. Check that the resulting amounts make sense.
3. Save to a separate manual slot.
4. Reload that new slot.
5. Confirm the balances persist.
6. Check shared-bank behavior after switching characters, if available.

Report the observed results. Do not claim success solely because the upload finished or the game loaded. Keep recovery copies until you are satisfied with the test and have deliberately decided how to handle cloud synchronization.

## Quick fixes for common confusion

| What happened? | What it usually means / next step |
|---|---|
| The local Library is empty, but the PS5 is connected | A live console connection and downloaded profile files are separate. Check the profile-root setting and Refresh. |
| A change to Settings did not affect the selected save | Recheck the actual selected Library profile, Upload folder and metadata path. Do not rely on the intended path alone. |
| The file picker is empty | Its filter may hide an extensionless container. Paste the verified full path into File name. |
| Encryption says it needs PS5IMAGE | The complete matching local export is missing. Do not borrow another save's image. |
| The checker says ASAV is still encoded | The PS5 container was opened, but the game's inner data still needs decoding. The standalone checker does not do that step. |
| The game loaded but the money did not change | First manually select the edited slot. If the slot is correct, stop and verify the returned/uploaded file rather than repeatedly restoring. |
| An account or wallet is missing from the report | It may be absent, unmapped or an unfamiliar structure. Do not interpret that as a zero balance. |
| GitHub downloads do not make the workshop work | The public-source snapshot omits required private runtime inputs. Contact the maintainer; do not obtain random executables. |

For research details, use [current findings](CURRENT-FINDINGS.md) and [validation](VALIDATION.md). For developer setup, use [SETUP.md](SETUP.md). You do not need to read the reconstruction history to run the read-only checker.
