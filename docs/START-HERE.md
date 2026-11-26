# START HERE — edit your GTA VI story save

**Read these steps in order. Use a copy of your save and keep your original backup.**

## 1. Download the EDITOR

Open [the recommended release](https://github.com/Twiggy4K/gta-vi-save-tools/releases/tag/v0.5.1-stash-preview.1).
Under **Assets**, download **GTA6-Decoded-Editor-0.5.1-stash-preview.1-Windows-x64-Portable.zip**.

- Do **not** choose “Source code” or the read-only checker.
- Right-click the downloaded ZIP → **Extract All**.
- Open the extracted folder → double-click **Start-Editor.cmd**.
- Keep every extracted file together. Node.js is included; no separate install is needed.
- The window title should say **0.5.1-stash-preview.1**. Close older editor windows.

**You should see:** four amount fields, including **Bed stash (experimental)**. An older three-field editor can reject stash-era saves.

## 2. Get the STORY save you want to edit

In GarlicTransfer, download/keep a backup of your console's saves. Choose the story-save entry whose name contains **SAVEDATASARC**.

| Choose | Do not choose for money editing |
|---|---|
| sdimg_SAVEDATASARC0000, sdimg_SAVEDATASARC0011, etc. | Player, SettingsProfileSettings, sce_sdmemory |

The number is the save slot. **11 is only our example, not a requirement.** Keep track of the slot you selected. The editor cannot tell you its mission name from that number alone.

Make four folders for this attempt: **1 Original**, **2 Edited**, **3 Encrypted**, **4 Verification**. Put each download in the matching folder; similar download names are easy to confuse.

**Stop if:** you have no untouched backup or do not know which story slot you selected. Never delete your recovery copy to make room for a test.

## 3. Prepare the downloaded save

For the browser workflow, sign in to [GarlicSaves](https://garlicsaves.com/decrypt), decrypt a **copy of the original encrypted story-save container**, and download the result into **1 Original**. Website uploads share your save and account metadata with that service. You decide whether to upload; our editor does not do it automatically.

If you already used local GarlicMgr on a JB PS5, its exported SARC file **may still need GTA VI decoding**. “Decrypted” does not always mean editor-ready. This is not necessarily a failed export.

**Stop if the editor says ASAV:** it needs game-level decoding before this tool can edit it. A compatible website export may provide this, but it is not guaranteed for every save. Do not rename ASAV to JSAV or change bytes yourself. Ask for compatibility help privately; keep account IDs and saves out of public issues.

**You should have:** a complete decrypted ZIP with the story save and its supporting files. Keep the ZIP together—do not pull out only SARC0000.

## 4. Open the ZIP and change the amounts

1. Click **1 Open decoded save / ZIP** in our editor.
2. Choose the ZIP from **1 Original**. If asked, choose the story slot you intend to edit.
3. Check the displayed original amounts against that same save in-game.
4. Enter the new amounts in the enabled boxes.
5. Click **2 Review + export decoded edit**, review the amounts, and confirm.
6. Click **Open output folder**. Copy **edited-decoded-save.zip** into **2 Edited**. Leave your original alone.

**What the boxes mean:**

| Box | What to expect |
|---|---|
| Cash | On-hand cash, up to 20,000. Disabled when no supported cash wallet exists. |
| Checking | Up to 2,000,000 in supported bank-era layouts. |
| Family Savings | Up to 1,000,000 in supported bank-era layouts. |
| Bed stash | Supported stash-era layouts only. Separate from on-hand cash. |

When **Bed stash** is supported, checking/savings stay read-only in this preview—even if your game has already unlocked banking. That is intentional. Chapter number alone does not determine support.

**Stop if:** the amounts look wrong, no matching character is found, or editing stays disabled. Updating to this preview fixes some older stash-layout errors, not every unknown layout. Do not force a selection or assume a disabled 0 is your actual balance.

**Important:** edited-decoded-save.zip is **NOT ready to transfer to the PS5**. You must encrypt it next. If you did not change any amount, you exported an unchanged copy.

## 5. Encrypt the EDITED ZIP

Click **3 Open GarlicSaves**, then sign in on the website. Upload **edited-decoded-save.zip from 2 Edited**, not the original ZIP.

Choose the account/profile belonging to the original save. Do not resign to someone else's account for an ordinary same-account edit.

### Check the profile ID order

In our website tests, **Add to profile** sometimes saved the ID in reversed byte order.

1. Compare the profile's actual Account ID with the Account ID on the **original decrypt job**. Keep it private.
2. **Only if that specific byte-order reversal is confirmed:** Dashboard → profile's three-dot menu → **Swap Endian** once.
3. Return to Encrypt and refresh/select the corrected profile. The profile name may not change; check the ID, not the name.
4. After encryption finishes, the job's **Previous Account ID** and **New Account ID** should agree for a same-account edit. If they differ, stop.

Do **not** swap every profile routinely or apply this website workaround automatically to local GarlicMgr.

Download the encrypted result into **3 Encrypted**. No worker/API key is needed for this manual website route.

## 6. Check the result BEFORE transferring

1. On GarlicSaves, decrypt a copy of the **exact new encrypted download from 3 Encrypted**.
2. Download that result into **4 Verification**. Do not reuse an older decrypted download.
3. Return to the **same editor session that made your edit**.
4. Click **4 Check decrypted return ZIP** and select the ZIP in **4 Verification**.

**You should see:** **Return comparison passed / MATCHED**.

**Stop if:** it says NOT VERIFIED. Send us the exact error and editor version. Do not restore it, delete backups, or ignore the warning. A match checks the returned content, not which file you choose to transfer or whether every save will load in-game.

## 7. Transfer the ENCRYPTED container

**This is the easiest step to mix up.**

| File | Use in GarlicTransfer as the replacement? |
|---|---|
| SAVEDATASARC0011 extracted from the encrypted download in **3 Encrypted** | **YES — slot 11 example** |
| sdimg_SAVEDATASARC0011 in a matching encrypted export | Follow the name/layout required by your GarlicTransfer workflow; retain its slot/account metadata. |
| SARC0011 from a decrypted ZIP | **NO — this is the game file, not the encrypted PS5 container** |
| edited-decoded-save.zip | **NO — it still needs encryption** |
| Anything from **4 Verification** | **NO — verification only** |

In the tested GarlicTransfer **Library** workflow, select the matching story slot → **More → Replace with another save** → choose the extracted encrypted container from **3 Encrypted**. Then use **Upload to PS5** / prepare upload. Check the destination console, user and upload list before proceeding. When GarlicTransfer is waiting for the PS5, go to **Settings → System → System Software → Data Transfer** on the PS5, select GarlicTransfer as the source, and follow the on-screen prompts. Review the user and selected saved data before starting. Your GarlicTransfer version may label screens differently.

GarlicTransfer can replace existing console saves. Keep local/cloud recovery copies. Do not delete all console saves as a general troubleshooting step. Follow its prompts; this editor does not control the transfer or simulate a console power button.

## 8. Test in the game

Manually load the intended save slot, **not an autosave**. Check the amounts, save separately, then reload and check again. If it cannot load or the values differ, stop and preserve the attempt's files for diagnosis. Use your known-good recovery copy if needed.

## Need help? Send these details

- Editor version from the window title.
- Exact error text or a screenshot with personal details covered.
- Game title ID, current character, mission/chapter, and displayed cash/stash/checking/savings.
- Whether the bed stash and bank are available.
- Which step above you reached.

Do not post saves, account IDs, keys, private paths or console identifiers publicly. A private sample may help if you choose to share it with a trusted reviewer. We never need your PSN password.

A transfer error before save data is sent is separate from money mapping. For NW-102265-6 or a disconnect immediately after 0x91, collect GarlicTransfer's version and a redacted log; an encrypted-return match does not solve a transfer handshake failure.

## What has actually been tested?

- The bank-era PS5 workflow loaded edited balances and preserved them after save/reload on the maintainer's tested save.
- One external early-game sample loaded 20,000 stash / 0 cash and survived save/reload. Its game-level rebuilding used private local research tooling; the public preview does not include that decoder.
- Other users' decoded stash-plus-bank layouts were recognized locally. Recognition alone is not in-game acceptance.
- The tool remains a preview. Not every save, game version, region/edition or progression state is supported.

[Technical details and historical workflow](ADVANCED-WORKFLOW.md) · [Stash research](STASH-RESEARCH.md) · [Validation history](VALIDATION.md)
