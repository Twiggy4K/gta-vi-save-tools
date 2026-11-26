# GTA VI Save Editor — START HERE

Edit supported **story-mode** cash, checking, Family Savings and bed stash values on your PC.

## 1. Download the current editor

**[DOWNLOAD THE WINDOWS PORTABLE EDITOR](https://github.com/Twiggy4K/gta-vi-save-tools/releases/tag/v0.5.1-stash-preview.1)**

Under **Assets**, choose **GTA6-Decoded-Editor-0.5.1-stash-preview.1-Windows-x64-Portable.zip**. **Do not choose “Source code” or the checker.** Right-click → **Extract All** → open **Start-Editor.cmd**. Node.js is included.

**Close old editor windows.** The new window title says **0.5.1-stash-preview.1**, and it includes a **Bed stash** field. Older three-field editors can reject early-game saves.

## 2. Follow the HOW-TO

# [HOW TO USE IT — STEP-BY-STEP GUIDE](docs/START-HERE.md)

**Back up → get your story save → decrypt → edit → encrypt → verify → transfer → save/reload.**

You need your own save, Windows x64, GarlicTransfer and compatible decoding/encryption. The tested website route needs GarlicSaves sign-in and shares your uploaded save/account metadata with that service; you do not need your own jailbroken PS5 for that route. Local GarlicMgr exports may need another game-level decoding step. Our editor does not bundle an ASAV decoder or request a worker key.

## Three things to get right

1. **Choose a story save:** its entry contains **SAVEDATASARC**. Not Player, SettingsProfileSettings or sce_sdmemory.
2. **Encrypt the editor's output:** upload **edited-decoded-save.zip**, not the original decrypted ZIP. If the website reversed your profile ID, follow the guide's conditional **Swap Endian** steps.
3. **Transfer the encrypted container:** use **SAVEDATASARC… from the encrypted download**. Never transfer **SARC… from a decrypted ZIP**.

Keep separate **Original**, **Edited**, **Encrypted**, and **Verification** folders. Keep untouched recovery backups.

## What can I edit?

| Supported layout | Editable amounts | Limits |
|---|---|---|
| Bank-era save | Cash, checking, Family Savings | 20,000 / 2M / 1M |
| Experimental stash save | Bed stash and an existing supported cash wallet | Stash preview policy 20,000; cash 20,000 |

In stash mode, bank/savings stay read-only. Missing cash wallets are not created. Unknown or ambiguous layouts refuse editing. The stash policy is not a verified game maximum.

## Stuck or seeing disabled boxes?

**[Troubleshooting and what to send us](docs/START-HERE.md#need-help-send-these-details)**

ASAV means the game file still needs decoding. An ambiguous mapping means this layout is not confidently supported—it does not mean you should force the values. Tell us the editor version, error and displayed game balances. Never post private saves, account IDs or keys publicly.

## Tested results and limits

A controlled PS5 bank-workflow test loaded the edits and preserved them after saving/reloading. An external volunteer also reported stash edit persistence; that sample used private local game-level rebuilding. Neither establishes support for every save. The separate **0xSavior** report of a PS5-derived save loading/saving/reloading in an Xbox-derived PC build does not establish general bidirectional conversion or retail Xbox support.

**70 automated checks pass.** Private samples and game-derived runtime inputs are not published. See [validation](docs/VALIDATION.md), [findings](docs/CURRENT-FINDINGS.md), [stash research](docs/STASH-RESEARCH.md), and [changelog](CHANGELOG.md).

## Developers and older tools

Source-only checkouts require Node.js 22+. Run the test command in [package.json](package.json). The read-only checker is separate from the editor. [Architecture](docs/ARCHITECTURE.md) · [advanced/historical workflow](docs/ADVANCED-WORKFLOW.md) · [legacy guide](docs/LEGACY-WORKFLOWS.md).

MIT for our independently written source; forks welcome. [License](LICENSE) · [credits](CREDITS.md) · [third-party notices](THIRD-PARTY-NOTICES.md). No affiliation with game/platform publishers. No saves, credentials, game executables or private codec inputs are bundled.
