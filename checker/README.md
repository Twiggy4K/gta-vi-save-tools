# GTA VI read-only compatibility checker — public read-only prerelease

This is a discovery tool, not a save editor. It performs no network requests, console operations, decryption or save modifications. A recognized layout is never labelled safe to edit or restore.

**First time using it? Follow [Part A of the plain-language user guide](../docs/USER-GUIDE.md#part-a--run-the-read-only-checker).** It explains installation, input files, report results and what to send back, without requiring programming knowledge.

## Tester instructions

1. Install Node.js 22 or newer if it is not installed. Windows PowerShell and .NET are used for the interface and ZIP reading.
2. Extract the checker into its own folder and run **Start-Checker.cmd**.
3. Open a **decoded JSAV save** or a decrypted ZIP whose SARC files are already decoded JSAV. The web-decrypted export used in the initial tests is an example. A PS5 container or a local GarlicMgr export containing game-encoded ASAV is not sufficient: this standalone checker deliberately does not include private decoding inputs.
4. Review the report, then choose **Save shareable report**. Review and share that report with the maintainer; no original save is needed for initial compatibility discovery.

Reports include inventory counts, recognized money/container item hashes, gameplay balances, numeric statistic character codes and ledger consistency. They exclude source paths, source filenames except generic slot labels, account IDs, GUIDs, ledger owners, original save contents, keys and raw error details. Reports are allowlisted summaries, not anonymized save exports. Gameplay balances can still be personal; review before sharing. The checker does not inspect param.sfo, sidecars or account metadata.

Unknown identifiers and ambiguous ownership are reported without guessing. Inventory numbers are only labels; they are not treated as Jason/Lucia identity. A zero account balance is distinguished from an absent or ambiguous account structure. Game version is not inferred from filename or campaign position.

ZIP input is bounded to 512 entries, 32 candidate slots, 8 MiB per slot and 128 MiB total candidate data. Candidate entries are read to random temporary files and deleted after inspection; archive paths are never used as filesystem destinations. Original input files are only read.

## For the maintainer

Ask selected testers to send the report first plus, separately, their game version, campaign stage, active character and the three balances shown in game. Do not ask for PSN credentials, keys or entire console backups. If a raw sample is subsequently needed, get explicit consent for a private transfer; save containers can contain identifying metadata. Keep samples out of Git and distribution ZIPs.

Next milestone: corroborate account ownership and mirror rules across independent saves before enabling a writer for those layouts. The previous sample-specific editor remains separate and unchanged.

## Independence and limitations

The package contains only independently authored read-only parsing/profiling code. It imports no private game executable, codec, save writer, GPL upstream implementation, network client or third-party dependency. Item-name/hash research leads are attributed to CoreyLyu76/gta6-save-editor; existing schema observations were corroborated against local saves. No claim of universal compatibility or first-of-kind status is made.

Node.js itself is not bundled. `runtime.local.json`, if present on the maintainer's machine, is a private local convenience and is excluded from the tester ZIP.
