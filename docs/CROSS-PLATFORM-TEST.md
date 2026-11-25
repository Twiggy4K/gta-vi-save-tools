# Cross-platform test record — 2026-11-25

Credit: **0xSavior**, the tester's authorized GitHub handle. Their sample, decoded data and rebuilt control remain private by explicit request.

## Locally verified

One externally supplied Xbox-labelled ASAV v2 file was inspected without execution of any game binary. Its header checksum matched the reconstructed formula. The existing body transform decoded it to JSAV v3 with 38 code blocks and 44 script blocks. The original 32-byte trailer matched the reconstructed generator. Its 82 ordered section identifiers agreed with the PS5 sample.

A recompressed/rebuilt control decoded byte-identically to the tester's original data. Re-protecting the original packed body reproduced the original file exactly. A separate owner-confirmed PS5 free-roam probe changed only the ASAV header version to 2 and regenerated the header checksum and trailer. Its protected body was unchanged and decoded byte-identically to the original PS5 JSAV. Header/body/trailer tamper checks were rejected. Both originals stayed untouched.

## Tester-reported gameplay evidence

0xSavior reported that the rebuilt Prologue control read fully without errors. The PS5-derived probe loaded into a daytime city street and ran for six minutes without errors. The tester subsequently reported successful saving and reloading of that imported state. The sender described their game build as 930.048.020; this version and build provenance were not independently determined by the research team. Rendering was described as incomplete, so visual correctness was not fully established.

## What this establishes—and does not

It supports load/save/reload compatibility for the tested PS5-derived state in that particular Xbox-derived PC environment, plus control acceptance of the rebuilding process. It does not establish a general platform converter, retail Xbox support, every PC build, fresh money edits in the Xbox-derived environment, trophy compatibility, all mission/world-state correctness or anonymous saves.

No sample, screenshot identifying a tester, account metadata, key, full decoded state or private runtime input is included in this repository. Please report new test results without posting private saves.
