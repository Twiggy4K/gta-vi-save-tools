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

## External stash gameplay confirmation — 2026-11-26

The owner relayed volunteer confirmation that the prepared PPSA38500 early-game test loaded with 20,000 bed stash and zero on-hand cash, then retained the values after saving and reloading. The volunteer reported resigning it to a second account. This is externally reported acceptance for one sample, not an independently observed console session or general resigning compatibility.

The game-level ASAV in that test was rebuilt with the maintainer’s private local codec; the public preview still does not distribute an ASAV decoder. The tested scalar edit is the experimental stash writer’s output. No missing cash wallet was created, and bank/savings remained unchanged. Keep broader stash support experimental pending additional samples. This supersedes earlier blanket statements that no stash gameplay test had occurred, while preserving their historical timing.
