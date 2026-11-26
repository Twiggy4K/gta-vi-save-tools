# Stash compatibility findings — 2026-11-26

Public source references: independently observed local save structures, plus owner-confirmed cash/stash values and a volunteer-confirmed stash-only balance. Third-party originals and account data remain private.

- Bed-stash currency parent item: decimal 4030395321. Cash-wallet parent item: 3984562790. These are game identifiers, not user IDs.
- Five early progression samples retain a stash. In two of them stash and banking coexist; chapter-based UI switching is therefore not justified.
- Early combined-money statistics can equal checking mirror + on-hand cash + stash. Some inactive-character records are stale and cannot be updated merely because their statistic ID matches.
- A volunteer sample contains a stash, zero cash statistic and no cash wallet. Combined statistic equals stash, explaining the previous mapping refusal.
- A separate later sample has no cash wallet; general missing-wallet creation remains unsupported.
- Twelve original exports were decrypted through the owner’s local GarlicMgr in temporary sessions. All decoded to 82 indexed blocks. Original exports were read only; no restores were performed.
- Experimental editor preserves banking values when stash is present and only edits corroborated existing fields. Six private samples passed local decrease/reparse/no-op checks. Gameplay acceptance remains untested.

No private runtime decoder material is distributed. Format detection and nested ZIP recognition do not perform ASAV decryption.
