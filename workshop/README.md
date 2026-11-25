# Workshop source snapshot

**For button-by-button instructions, follow [Part B of the user guide](../docs/USER-GUIDE.md#part-b--edit-a-supported-save-in-the-local-save-workshop).** It applies only to explicitly supported saves in a prepared private installation.

See ../docs/SETUP.md, ../docs/ARCHITECTURE.md and ../docs/CURRENT-FINDINGS.md for current operation, evidence and limitations.

This profile-specific Windows workflow backs up source exports, previews balance edits, rebuilds the game body, packages matching sidecars, optionally encrypts via local GarlicMgr and verifies the returned file. Restoration remains manual in GarlicTransfer. Choose the complete local export before opening the decoded save ZIP; enter your own local manager address. No machine-specific paths or default console address are distributed.

Limits are conservative editor policies: 20,000 cash, 2M checking, 1M savings. Above-2M checking persistence was reported after a gameplay transaction; that does not establish a universal maximum or remove profile assumptions. The unknown occupied checking-container capacity is still bounded by an observed sample quantity. Larger balances and arbitrary-save support need broader evidence.

The source snapshot requires separately held private codec/runtime inputs and is not a standalone release. No private assets are supplied. Do not publish this source as a generally usable editor without completing the release-readiness checklist.
