# Private data and operating boundaries

Never commit saves, encrypted containers, account IDs, sidecar keys, game executables, lookup tables, raw disassembly, decoded private documents, credentials, machine-specific runtime configuration or private fixtures. Source-only allowlists and audits apply even while visibility is private.

The read-only checker does not connect to a console or network and does not modify inputs. Its shareable report includes gameplay balances and structure metadata; review it before sharing. It excludes direct account identifiers, paths, GUIDs and save contents by construction, but is not a guarantee of anonymity.

The optional workshop local-processing step sends copies to an explicitly confirmed private IPv4 GarlicMgr endpoint and uses temporary files/mounts on the modded PS5. Redirects and public destinations are rejected. It does not resign the account or call restoration/import APIs. No third-party upload occurs through that workflow. Acquisition and retail restoration remain separate GarlicTransfer operations.

Use verified backups and separate working profiles. Confirm actual Library, Upload and metadata paths. Do not replace a raw save with a ZIP. Cloud auto-sync can replace recovery data; preserve independent offline backups and pause syncing while testing. Upload may require deleting destination game saves; inspect the scope rather than assuming individual-slot deletion.

Unknown structures fail closed. Local integrity checks do not prove gameplay acceptance or universal write compatibility. Private reconstruction inputs remain separately held, bounded-analysis data; native game code is not launched.

Current-tree cleanup does not erase older Git commits or de-identify the GitHub account. This public repository starts with clean source-only history; the historical research archive stays private. Report concerns privately without attaching private data.
