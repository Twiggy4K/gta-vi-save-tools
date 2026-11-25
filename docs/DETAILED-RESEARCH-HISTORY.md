# From encrypted exports to a local save-editor prototype

## A detailed, evidence-based history of the GTA VI PS5 save research

**Project:** Project maintainer, with Arty / OpenAI Codex
**Record assembled:** November 23, 2026; updated through November 24, 2026.
**Purpose:** Give the maintainer and independent review a self-contained account of the observations, failed approaches, corrections, implementation choices and verification that produced the current prototype.

This document is intentionally long. It describes the route from the first exported saves through executable-assisted reconstruction and the Windows editor. It is a retrospective assembled from the preserved local reports, source and test results. It is not a verbatim transcript, a reconstruction of undocumented hours, or proof that every intermediate step occurred at a particular minute. The strongest date anchors are the November 19 save-analysis reports and the November 23 executable/prototype/repository work.

**Historical status through 2026-11-24 (superseded by section 45):** Sections 1–35 preserve the earlier reconstruction-stage history. Their then-unverified gameplay and bank statements are historical, not the present project status. Sections 36–44 below record the later corrections, current money writer, retail acceptance, capacity findings and closed-test baseline. See [current findings](CURRENT-FINDINGS.md) and [validation](VALIDATION.md) for the concise current evidence boundary.

No original save, private decoded JSON, account identifier, executable, lookup-table payload or raw game disassembly is included in this repository or this document. Examples use public format markers, implementation metadata and the cash values the maintainer deliberately supplied as experimental observations.

## Contents

1. [What we were actually trying to solve](#1-what-we-were-actually-trying-to-solve)
2. [The evidence discipline used throughout](#2-the-evidence-discipline-used-throughout)
3. [The original sample set and controlled purchase](#3-the-original-sample-set-and-controlled-purchase)
4. [Separating transfer, platform containers and game encoding](#4-separating-transfer-platform-containers-and-game-encoding)
5. [The first ASAV inspection](#5-the-first-asav-inspection)
6. [Why the no-action control mattered](#6-why-the-no-action-control-mattered)
7. [Direct compression and legacy compatibility tests](#7-direct-compression-and-legacy-compatibility-tests)
8. [Recovering the header checksum by inversion](#8-recovering-the-header-checksum-by-inversion)
9. [What header editing did and did not establish](#9-what-header-editing-did-and-did-not-establish)
10. [Differential evidence and the limit of save-only analysis](#10-differential-evidence-and-the-limit-of-save-only-analysis)
11. [The early ASAV Lab foundation](#11-the-early-asav-lab-foundation)
12. [What changed when the executable became available](#12-what-changed-when-the-executable-became-available)
13. [Building a bounded static-analysis route](#13-building-a-bounded-static-analysis-route)
14. [Connecting the executable to our observed format](#14-connecting-the-executable-to-our-observed-format)
15. [Resolving indirect provider selection](#15-resolving-indirect-provider-selection)
16. [Recognizing counter-based protection](#16-recognizing-counter-based-protection)
17. [The serializer/vtable correction](#17-the-serializervtable-correction)
18. [Establishing compression order and body boundaries](#18-establishing-compression-order-and-body-boundaries)
19. [Reconstructing the parameterized block primitive](#19-reconstructing-the-parameterized-block-primitive)
20. [The first complete body decodes](#20-the-first-complete-body-decodes)
21. [Why the trailer was a separate problem](#21-why-the-trailer-was-a-separate-problem)
22. [Encoded operations and runtime lookup initialization](#22-encoded-operations-and-runtime-lookup-initialization)
23. [The failed conversion diagnostic and its resolution](#23-the-failed-conversion-diagnostic-and-its-resolution)
24. [Identifying and independently checking SHA-256](#24-identifying-and-independently-checking-sha-256)
25. [Reconstructing the outer finalization](#25-reconstructing-the-outer-finalization)
26. [What the five exact trailer matches prove](#26-what-the-five-exact-trailer-matches-prove)
27. [Returning to the controlled cash experiment](#27-returning-to-the-controlled-cash-experiment)
28. [Editing JSON without corrupting unrelated data](#28-editing-json-without-corrupting-unrelated-data)
29. [Rebuilding the protected ASAV file](#29-rebuilding-the-protected-asav-file)
30. [The local acceptance tests for the editor](#30-the-local-acceptance-tests-for-the-editor)
31. [The Windows interface and the real PATH bug](#31-the-windows-interface-and-the-real-path-bug)
32. [What is actually in GitHub](#32-what-is-actually-in-github)
33. [External-source mistakes and the correction](#33-external-source-mistakes-and-the-correction)
34. [The unresolved work and the next decisive experiment](#34-the-unresolved-work-and-the-next-decisive-experiment)
35. [Evidence matrix, terminology and review checklist](#35-evidence-matrix-terminology-and-review-checklist)

---

## 1. What we were actually trying to solve

The maintainer wanted to inspect and eventually edit offline GTA VI story saves from his PlayStation. The initial practical idea was straightforward: obtain the save, find a known balance, change it, put it back. The difficulty was that “the save” was not one transparent document with one checksum.

We ultimately had to distinguish at least these transformations:

```text
Console transfer protocol
    -> encrypted PlayStation save container
        -> exported game files
            -> ASAV header + protected/compressed body + integrity trailer
                -> JSAV indexed JSON
                    -> a gameplay-related numeric field
```

Success at one arrow did not solve the next. Downloading a container did not decrypt its filesystem. Mounting/exporting the container did not decode GTA VI's protected story body. Reading a header did not identify money. Finding a numeric correlation did not prove the game would honor an edit. Reproducing a trailer did not restore a retail container.

That separation became the main organizing principle of the work. It explains why the research took several passes and why the current prototype can be a genuine implementation milestone while still needing an in-game acceptance test.

## 2. The evidence discipline used throughout

The research used preserved originals, separate analysis copies and reproducible checks. Local scripts read the original inputs, calculated fingerprints, and rechecked them after analysis. Private contents were normally kept in memory; reports recorded counts, lengths, hashes and validation outcomes rather than decoded player data or parameters.

We used four evidence levels, even when individual early reports used slightly different labels:

1. **Observation:** a byte range, repeated prefix, size relationship or user-reported balance.
2. **Hypothesis:** a possible explanation such as a nonce/tag layout or a counter stream.
3. **Reconstruction with tests:** our implementation of the observed behavior, checked on synthetic data or known samples.
4. **Gameplay acceptance:** the edited save loads, the value changes, and the result survives another save/reload.

The first three levels are now represented in the repository. The fourth remains open.

There were also different kinds of tests. A synthetic counter test checks carry order; it cannot identify a game cipher. A header checksum match verifies a range and formula; it cannot authenticate the story body. A forward/backward reconstruction can share a mistake in both directions. Exact matches against previously existing original trailers provide a different, stronger external constraint. Each result needed its proper scope.

## 3. The original sample set and controlled purchase

The preserved analysis set eventually comprised seven ASAV payloads: five story/archive samples plus Player and SettingsProfileSettings.

| Sample | Observed role | File bytes | Experimental relevance |
|---|---|---:|---|
| Player | Small structured player payload | 2,012 | Different representation from protected story data |
| SettingsProfileSettings | Readable settings JSON after its header | 7,502 | Header and raw-JSON research opportunity |
| SARC0000 | Earlier “Gone Fishing” story save | 295,392 | Additional independent story-format example |
| SARC0001 | “Coming Home” baseline | 329,648 | the maintainer reported 338 on hand and 3,001 stash |
| SARC0002 | After buying ammunition for 21 | 330,208 | the maintainer reported on-hand cash falling to 317 |
| SARC0002-control | Same-slot no-action resave | 330,368 | Cash still 317; control for incidental save changes |
| memory.dat | Autosave backing file | 2,097,152 | Active data shorter than physical file capacity |

The controlled observation was not just “these files differ.” It was:

```text
Before deliberate transaction: on-hand cash 338
After spending 21:            on-hand cash 317
After no-action resave:       on-hand cash 317
```

The 3,001 stash amount was a separately reported baseline observation, not a decoded field assignment. Later, the maintainer progressed much further through the campaign and described BuckMe bank balance plus cash on hand capped at 20,000. Those newer gameplay observations did not magically turn the older exported samples into a fresh 77%-completion dataset.

The original no-action export lived under the user's “New Save 3” folder. We preserved a separately named analysis copy so that later tooling could distinguish it from the post-purchase SARC0002 with the same internal slot name.

## 4. Separating transfer, platform containers and game encoding

The initial Garlic research examined existing GarlicTransfer and Garlic SaveMgr source snapshots and recorded revision/version differences. An important early finding was that multiple operations commonly called “decrypt” were not the same thing.

GarlicTransfer's download path decrypts transfer-channel records and validates transfer framing. Its downloaded payload is still an encrypted PlayStation save container. The transfer oracle is part of the transport workflow; choosing a local oracle does not establish a local general-purpose game-save editor backend.

SaveMgr's mounting/export path operates at the platform-container layer. The initial review noted that mounting can elevate credentials, create working copies and invoke privileged filesystem operations; unmounting is described by that tooling as re-encrypting the container image. We therefore treated original images and mountable working copies separately.

The November 19 inspection report records successful exports of the existing container set through SaveMgr on the research console. Independent backup-image hashes remained unchanged. That gave us game payload files such as SARC0001, not a decoded GTA VI story document.

The exported SARC0001 was byte-identical to an earlier independently exported story payload. That was useful provenance: the opaque body was not just an accidental transformation introduced by one copy operation. It still did not tell us how to decode it.

This distinction also explains the return path. Our editor rebuilds the inner ASAV file. A later, separately reviewed operation must put it into its matching platform container with the correct metadata, re-encrypt that container, and return it to a compatible console.

## 5. The first ASAV inspection

The first offline inspector looked for magic, repeated layout, plausible boundaries, readable text and declared lengths. It found `ASAV` at offset zero and a common apparent version value of 1 in our samples.

The early map was deliberately provisional. Later reconstruction supported the following working layout for the preserved compressed story profile:

| Offset | Working interpretation | Qualification |
|---|---|---|
| `0x000` | `ASAV` marker | Directly observed |
| `0x004` | Version field, 1 in preserved samples | Not a claim that other versions match |
| `0x008` | Payload type | Story 1, settings 2, Player 3 in this set |
| `0x00c` | Mode/profile field | Story 3; readable examples 1 |
| `0x010` | Story field containing `0x180` | Not adopted as the actual body boundary |
| `0x014` | Header-size-related value `0x170` | Agrees with observed body start |
| `0x018` | Header plus packed-body length | Established later, not at first inspection |
| `0x01c` | Header plus logical decoded length | Established later by decoded results |
| `0x020` | Timestamp-like metadata | Not needed to identify cash |
| `0x028` | UTF-16LE display title | E.g. Coming Home |
| `0x128` | Observed slot-name region | Preserved, not freely regenerated |
| `0x15c` | Slot-related integer | Agrees with manual slots in the samples |
| `0x160` | Header checksum | Formula recovered later |
| `0x168` | Active stored end | Crucial for autosave capacity handling |
| `0x170` | Protected story-body start | Confirmed by later writer/prefix tracing |

The readable settings file helped establish that the header really ended at `0x170`. Player and settings were not, however, known plaintext counterparts for story data. Their type/mode and body representations differed.

The autosave was especially important. Its physical file was 2 MiB, but its active end was 327,584 bytes. Treating the whole file as active ciphertext would mix in trailing backing-file contents and give misleading entropy, compression and integrity tests. Early work preserved that remainder rather than assuming it was meaningless.

## 6. Why the no-action control mattered

The post-purchase save and its control both represented 317 cash, yet the control file was 160 bytes larger. A logical-length-related field grew by 528 bytes. Timestamp-like metadata changed. Most aligned protected blocks changed as well.

That immediately undermined the idea that the 21-dollar purchase could be located by finding a small cluster of differing encoded bytes. A save operation includes time, world simulation, changing state and potentially variable compression; a no-deliberate-action resave is not a frozen application snapshot.

The control served two purposes at different stages:

- **Before decoding:** it showed why broad ciphertext differences could not be assigned to money.
- **After decoding:** it supplied the expected stable 317 value needed to reject many unrelated numeric changes.

Some pairwise comparisons shared long equal runs at the same offsets. Later all-sample analysis found an exactly shared 46-byte prefix in the five story inputs. Those are different comparison scopes: a pair can share more bytes than all five together. Neither result identified a fresh nonce or a particular cipher.

## 7. Direct compression and legacy compatibility tests

The first bounded probes tried ordinary compressed representations at plausible offsets. Direct zlib, gzip and raw-DEFLATE attempts at the candidate boundaries failed. Selected CRC32 ranges failed to explain the changing header field. Published older Rockstar save-code references were inspected as compatibility leads, not assumed to apply to GTA VI.

The reports record several finite negative experiments:

- A published older-game AES-ECB reference under selected offsets and marker/decompression checks did not yield a valid story decode.
- A speculative GCM framing used a candidate prefix as nonce, a candidate suffix as tag, a limited legacy-key set and three AAD choices. All 60 authentication attempts failed.
- Later explicitly enumerated legacy-key/algorithm/layout compatibility candidates numbered 208; none produced the required coherent output.
- Another bounded group of 448 simple XOR-generator/seed/layout candidates did not produce a validated decode.

These numbers describe the enumerated experiments, not an exhaustive search of encryption possibilities. Failure did not prove that a named algorithm was impossible. Nor did it justify unlimited brute force against an unknown strong key.

One result could easily have misled us: an unauthenticated candidate yielded 12,672 bytes through a Brotli decoder while consuming only 12,887 bytes from a much larger candidate input. Its size was wrong, authentication had failed, and no complete save structure followed. It was rejected as a false positive.

That led to a stricter standard for “decoded”: correct framing and lengths, coherent full structure, several independent samples, and appropriate round trips—not a short marker or a permissive decompressor accepting a fragment.

## 8. Recovering the header checksum by inversion

The first substantial format breakthrough was the header checksum. We did not obtain it by finding a familiar constant in a search result or blindly trying every possible seed.

The changing field at `0x160` was treated as a possible result of a 32-bit mixing function. Selected CRC, FNV and Jenkins-like variants over contiguous ranges did not directly match with the initial choices. The crucial next move was to exploit invertibility in a Jenkins one-at-a-time style recurrence.

In 32-bit arithmetic, multiplication by an odd integer is invertible modulo `2^32`. The update's `h + (h << 10)` is multiplication by 1025. The final `h + (h << 3)` and `h + (h << 15)` correspond to multiplication by 9 and 32769. XOR with a right-shifted copy is also invertible by combining successively shifted copies.

For a candidate covered range and known final checksum, the experiment could therefore:

1. Undo the final multiplication by 32769.
2. Undo XOR-right-shift 11.
3. Undo multiplication by 9.
4. Walk input bytes backward, undoing XOR-right-shift 6, multiplication by 1025, and byte addition.
5. Compare the recovered initial states across samples and signed/unsigned-byte variants.

The successful combination was the **full `0x170`-byte header**, with the checksum bytes treated as zero, **signed input bytes**, and effective initial state `0x4BF672ED`.

Equivalent forward pseudocode:

```text
h = 0x4BF672ED
for each byte position i in [0, 0x170):
    b = 0 when i is in [0x160, 0x164)
        otherwise the input byte interpreted as signed int8
    h = h + b                         modulo 2^32
    h = h + (h << 10)                 modulo 2^32
    h = h XOR (h unsigned-right-shift 6)
h = h + (h << 3)                      modulo 2^32
h = h XOR (h unsigned-right-shift 11)
h = h + (h << 15)                     modulo 2^32
store h as little-endian uint32 at 0x160
```

All seven preserved samples independently agreed. JavaScript and a separately run Python verifier reproduced all seven checksums. At this stage, the seed was an empirically equivalent initial state; later executable analysis showed the literal in the candidate implementation.

The current repository implementation is [header/header-codec.cjs](../header/header-codec.cjs).

## 9. What header editing did and did not establish

Once the header checksum was known, a copied title could be changed, its header checksum repaired, and its title changed back to reproduce the original complete file exactly. A local title-only experiment changed title bytes plus the four checksum bytes while keeping every byte after `0x170` untouched.

That was useful, but its meaning was narrow. A corruption test deliberately changed a body byte while the header checksum still passed. The header checksum did not authenticate the body.

There is an additional retrospective point: later tracing proved the final trailer covers the header too. A title-only copy with a repaired **header** checksum but the original **trailer** is therefore not established as a complete valid game save. The original reports correctly treated it as a research artifact, not a restore-ready result.

This is why two integrity mechanisms must remain separate in the narrative: recovering the header checksum was a genuine breakthrough, but it was not the later trailer solution.

## 10. Differential evidence and the limit of save-only analysis

Byte-level comparisons became more discriminating than initial aligned block counts. Long matching runs often began or ended between 16-byte boundaries. Across the ten story-sample pairs, searching every byte offset did not locate an identical 16-byte sequence shifted elsewhere. There were no repeated aligned blocks within an individual active story body under the tested model.

Those findings weakened a simple full-body ECB interpretation. They did not identify the actual block primitive.

A later differential experiment compared aligned XOR and modular subtraction between saves, plus deliberately shifted comparisons. It excluded the shared prefix and a candidate tail region so those could not trivially dominate the measurement. Eighty measurements covered ten sample pairs, two operations and the selected alignment variations.

The aligned residuals were more biased and compressible than shifted residuals. For the purchase/control pair, aligned XOR equality was about 5.37%, while shifts approached the roughly 0.39% equality reference for independent uniformly distributed bytes. Changed-byte residuals also had a nonuniform distribution.

For a reusable XOR keystream, the identity

```text
C1 = P1 XOR K
C2 = P2 XOR K
C1 XOR C2 = P1 XOR P2
```

explains why alignment could expose structure. It was a sensible model to investigate. It was not proof: deterministic transforms, related plaintext and compression can also create correlations, and the ten pairs share only five underlying samples.

The practical conclusion was to stop pretending that more random purchases alone would reveal the hidden processing chain. Stronger evidence was needed: an implementation/trace of the game's save routine, a trusted game-layer encoded/decoded pair, or a reproducible documented codec.

## 11. The early ASAV Lab foundation

While the story body remained opaque, an earlier local prototype explored what was honestly supportable: header inspection, copy-only title editing, and exact-token changes to the already readable settings representation.

That earlier ASAV Lab was not the later story editor. It explicitly rejected protected story data for its settings-editing operation. Its useful design lessons carried forward:

- Never overwrite input files.
- Require the expected input representation.
- Preserve unrelated bytes and formatting.
- Treat a single changed leaf as an acceptance condition.
- Separate header validity from body validity.
- Reject unsupported layouts rather than silently applying a guess.

Settings-name research found plausible hash labels, including a settings boolean matching “money.” That was not a wallet balance. A convincing English label or hash match is not enough to assign gameplay semantics.

The early work was worth retaining because it supplied a tested inspection/checksum foundation and habits for later editing. It did not solve the story decoder before the executable evidence arrived.

## 12. What changed when the executable became available

On the November 23 phase, the maintainer provided a local candidate executable named `game_scarlett_master.exe`, a research brief and related release-description material. The recorded executable was 120,181,760 bytes and parsed as PE32+ AMD64 with image base `0x140000000`.

It was an **Xbox-related native executable candidate**, not a decrypted PS5 `eboot.bin`, not proof of a playable PC release, and not evidence of a new 14.23 PS5 jailbreak. This distinction answers an important misconception in the surrounding conversation: the successful route did not require us to obtain a working retail GTA VI process on the 13.60 research PS5.

The file's fingerprint and PE measurements matched a separately described research artifact. That supported file identity, not publisher authenticity, malware safety or completeness. The adjacent release README was treated as untrusted description. Downloading additional assets was not necessary to inspect the save-processing routines already in the executable.

The executable and an analysis copy were fingerprinted and preserved. It was not launched as a native program or loaded as a library. Initial work used static parsing and bounded disassembly. Later, a limited subset of its final-stage instruction semantics was evaluated in our own isolated arithmetic model; that distinction is described explicitly in section 25.

## 13. Building a bounded static-analysis route

The static PE parser validated file bounds, machine/layout fields, section ranges and file-backed RVA mappings. Its important job was not to produce a glamorous whole-program decompilation. It was to answer smaller trustworthy questions: does this address correspond to bytes in this file, which section backs it, and is a requested read inside bounds?

The initial inventory recorded ten sections, 587 import-list entries and 299,257 nonempty exception-directory ranges. The exception count was not treated as a count of source functions: optimized code can split functions into fragments, and a range ending is not proof that a logically connected routine has ended.

Raw call-pattern or RIP-reference searches were used as candidate xrefs, not accepted as proof by themselves. GNU objdump in the existing Ubuntu installation provided bounded instruction-aligned views for selected addresses. The candidate list then had to be checked against actual instructions and control flow.

The earliest “go” decision was **go for static investigation**, not go for executable launch or save restoration. No new external package was necessary for that pass. Scripts recorded static anchors and input fingerprints so later steps could be tied to the same file.

The source now represented by [research/static-pe.cjs](../research/static-pe.cjs) retains those bounded parsing principles.

## 14. Connecting the executable to our observed format

The first strong bridge was the already solved header checksum. In the candidate executable, a header routine at RVA `0x28d0410` saved the field at `+0x160`, zeroed it, invoked a hash over `0x170` bytes with literal `0x4BF672ED`, then restored the original field.

The hash update sign-extended input bytes and used the same shifts as our recovered formula. The finalization matched too. That upgraded the checksum seed from an empirically recovered effective state to an observed literal in this candidate.

The type/mode mapping also agreed with our seven samples for their represented types. Those agreements supplied a concrete reason to study this file's save pipeline. They did not prove all code or parameters were identical on PS5.

One difference was deliberately retained: an initializer in the candidate wrote ASAV version **2**, while our preserved PS5 files used version **1**. Later empirical body/trailer results established compatibility for the selected parameterized paths and the tested samples; they did not erase this version distinction or justify accepting every ASAV v2 file.

The nearby writer and reader paths then gave call-chain anchors for save-buffer handling, header generation and an additional 32-byte overhead. At first the 32-byte return was just overhead evidence. It was not yet a confirmed MAC, digest, nonce or tag.

## 15. Resolving indirect provider selection

The code did not reduce to one direct `decrypt_save()` call with a friendly name. It used managers, factories, vtables, selectors, direction fields and separately initialized descriptors.

The trace followed a processing selector value of `0x14` / decimal 20 through a signed jump-table entry, a factory branch, provider constructors, installed vtables and an active-provider field. It kept that selector separate from the ASAV payload-type field. Calling it “save type 20” would have been wrong.

The selected provider's setup and update wrappers were then followed to their concrete target. A fixed argument of 16 was not treated as enough evidence for AES. Likewise, the manager's `+0x18` provider route was kept separate from `+0x38` and `+0x40` routes that later mattered for the trailer.

This unglamorous indirection work prevented a common reverse-engineering failure: identifying an interesting cryptographic-looking function somewhere in a large program and assuming it processes the specific bytes under investigation.

The trace needed both ends: the actual selected algorithm and evidence that the story writer passed our body range into it.

## 16. Recognizing counter-based protection

The selected update routine had a distinctive sequence:

1. Consume any leftover transformed bytes from a prior call.
2. Copy a 16-byte counter into a temporary block.
3. Increment the stored counter from its last byte toward lower addresses, with carry across the configured width.
4. Transform the copied counter block.
5. XOR the transformed bytes with input bytes.
6. Preserve unused transformed bytes for the next call.

That is a counter-keystream/XOR structure. It is not compression. The order matters: transform the copied initial counter **before** using the incremented value for the next block. Buffering unused keystream also matters, or the result will depend incorrectly on application chunk boundaries.

The eventual helper therefore has the equivalent behavior:

```text
for each input byte:
    if no keystream remains:
        keystream = block_transform(copy(counter))
        increment counter with big-endian carry over selected width
    output byte = input byte XOR next keystream byte
```

XOR symmetry explains why the same stream operation can protect and unprotect the body under the same starting state. It does not by itself identify the underlying 16-byte transform as an ordinary standard-library cipher.

## 17. The serializer/vtable correction

The serializer-to-protection bridge required a correction to an earlier interpretation of adjacent vtable data. A nearby table had been treated too broadly, which put the writer method at the wrong slot. Another reference initially looked like construction evidence but belonged to a destructor/table-installing sequence.

The corrected constructor explicitly installed a table sixteen bytes after the adjacent table. That made the actual writer method slot `+0x18`, not the previously followed `+0x28`. The packed owner stored the relevant writer at `+0x60`, and its accessor returned that exact field. A different object and accessor at nearby fields were not interchangeable.

Why this mattered: an incorrect vtable boundary can produce a plausible-looking but irrelevant chain. A few bytes of ownership/layout interpretation can decide whether we are tracing serialization or a different object service.

The work then followed the packed owner/accessor to the real writer and its buffer base. This closed the structural gap rather than papering it over with an assumed “serializer probably calls compressor” statement.

## 18. Establishing compression order and body boundaries

The decompressor's instructions matched the raw LZ4 block format: token nibbles for literal/match lengths, extension bytes, a little-endian 16-bit backward offset and overlapping match copies with a base length of four. The complementary packer used a hash workspace and copied a successful compressed result back into the body buffer.

A header-prefix helper supplied `0x170`, while writer/buffer accessors added that prefix to reach the body pointer. This resolved the conflict between the actual body start and the tempting `0x180` value seen elsewhere in the header.

The story save state machine supplied the order: submit serialization, wait for completion, optionally initialize and submit compression, wait for that work, then finalize the padded/protected story output.

The word **optionally** is important. Static code could skip compression. Our preserved compressed profile later passed raw-LZ4 decoding on every sample; that does not license treating every future story representation as compressed. The current decoder is deliberately profile-limited and rejects unsupported data rather than silently inventing a branch.

At this point the working direction was:

```text
JSAV serialization -> optional raw LZ4 packing -> padding/protection
```

The inverse we would test was protection reversal, padding removal, then bounded raw-LZ4 decoding. The trailer still had to be excluded correctly and later reconstructed independently.

## 19. Reconstructing the parameterized block primitive

The 16-byte transform was reconstructed as data-driven code instead of being replaced with a guessed standard cipher name. Its parameterized implementation uses:

- Sixteen position-specific 256-byte input maps.
- Initial assembly into four 32-bit words and word XORs.
- Thirteen rounds of table mixing with per-round words.
- Sixteen position-specific output maps and the final byte permutation.

In each mixing round, output column `c` combines a round word with four table terms. Row `r` selects source column `(c + r) mod 4`; a selected source-word byte indexes the corresponding table. The implementation uses unsigned 32-bit behavior throughout.

Synthetic tests used artificial tables and words chosen to make expected permutations/parities easy to calculate. Separate checks covered parameter copying, malformed inputs, counter-width carry, arbitrary split updates and XOR symmetry. These tests established that our model behaved as designed before real private parameters were supplied.

The actual setup descriptor was found through the traced registry. The selected record was one of 24 static records, with a 4,340-byte descriptor layout consisting of a marker, 60 little-endian words and sixteen output maps. Input and mixing tables were referenced separately. The selected initial counter was another static argument.

Private parameters were read from the fingerprinted local file into memory, not dumped into repository source. The model code contains the operations and selectors; the current runtime dependency on those private assets is real and explicitly documented.

## 20. The first complete body decodes

The first whole-body attempt failed to decode as raw LZ4. The important cause was framing: it retained padding and included the final 32-byte overhead. That was not evidence that the selected transform was irrelevant to PS5.

Because the counter operation does not feed input bytes back into its state, including extra bytes after the true body does not change the already processed prefix. The initial diagnostic could therefore discard the final transformed 32 bytes, validate the repeated-length padding, and decode the remaining packed stream. The optimized codec now excludes the trailer before transforming anything.

The decisive inverse path was:

```text
active range from storedEnd
    -> exclude final 32 bytes
    -> transform bytes starting at 0x170 with the reconstructed counter stream
    -> validate/remove repeated-length padding, 1 through 16 bytes
    -> bounded raw LZ4 decode
    -> validate complete JSAV structure and header length agreement
```

All five preserved story samples succeeded:

| Sample | Decoded bytes | Code blocks | Script blocks | Indexed blocks |
|---|---:|---:|---:|---:|
| SARC0000 | 1,018,800 | 38 | 44 | 82 |
| SARC0001 | 1,108,848 | 38 | 44 | 82 |
| SARC0002 | 1,110,288 | 38 | 44 | 82 |
| SARC0002-control | 1,110,816 | 38 | 44 | 82 |
| memory.dat | 1,102,240 | 38 | 44 | 82 |

The checks were much stronger than finding `JSAV` at the beginning. Each output had version 3, matching array counts, a valid 82-record index, in-range block spans and successful parsing of every indexed JSON slice plus the full JSON document. Decoded size plus `0x170` agreed with the original logical-length field. These are separately preserved saves from one user's campaign, not five statistically independent players or builds.

The index begins after a 16-byte JSAV header. With 82 records of 20 bytes each and 16-byte alignment, the JSON body starts at decimal 1664. The implementation preserved the other index fields rather than inventing meanings for them.

Unchanged protected-body round trips also passed: decrypt the original padded packed bytes and apply the same counter stream again, obtaining the exact original protected bytes. That test alone would be too weak—many wrong XOR streams are symmetric—but combined with all the structural and length checks across five separately preserved originals, it became meaningful corroborating evidence.

At that milestone we had a real read-only story decoder. We did **not** yet have a valid edited-save generator, because the trailer remained unresolved.

## 21. Why the trailer was a separate problem

The final 32 bytes could not be treated as spare capacity or copied blindly after a modification. The writer-side trace established that the header is written first, the full buffer beginning is passed into the selected integrity provider, and the provider's 32-byte overhead is subtracted to obtain the covered length.

That established exact coverage:

```text
covered = file bytes [0, storedEnd - 32)
trailer = file bytes [storedEnd - 32, storedEnd)
```

The covered input includes the ASAV header and encrypted padded body. It excludes the trailer and any inactive backing-file remainder after storedEnd. An editor changing either a header field or body therefore needs to regenerate the trailer, not merely fix the header checksum.

The production route was followed through manager slot `+0x38` and its concrete provider factory. A separate `+0x40` route used a different provider selection. We did not assume that the two were interchangeable or call the second an inverse simply because their descriptors had the same size.

Final output had another precise detail: the wrapper reverses all **32 result bytes**. Reversing bytes inside individual words is not equivalent. Getting the internal digest right with the wrong wrapper ordering would still fail every stored-trailer comparison.

Simple baselines were tested against the correctly covered range. Plain SHA-256, its byte reversal, body-only diagnostic variants, and later a plain hash of the reconstructed inner candidate did not reproduce the trailers. These failures excluded those particular shortcuts. They did not prove that SHA-derived processing was absent; the actual path had initialized encoded state and another finalization stage.

## 22. Encoded operations and runtime lookup initialization

The trailer engine used small encoded symbols and lookup/carry operations rather than a transparent call to a library hash API. The reviewed operation selectors were parsed as exact 64-bit tokens. Using a floating-point JavaScript Number for these selectors would lose high bits, so the implementation uses BigInt.

The token fields are:

| Bits | Role in the reviewed helper families |
|---|---|
| 0–21 | Mapping-stream offset |
| 22–35 | Prefix count for helpers that consume a prefix |
| 36–49 | Main output count |
| 50–63 | Tail count |

Three helper families were reconstructed:

- A byte-lookup binary/carry operation that combines two input streams, mapped symbols and masked carry, emitting low three-bit symbols.
- A shifted variant that consumes a prefix without emitting it, then emits the selected region and tail.
- A word-lookup operation with a wider carry representation and distinct prefix/tail handling.

These details were not decorative. Aliasing matters when a helper reads and writes the same buffer. Prefix consumption must retain carry even though it emits no bytes. The word-family tail reuses an input region starting at index 2 and combines the full carry, rather than the masked carry used in the main loop.

One earlier transcription of the shifted family's tail was wrong: it read the caller's second input, while the reviewed instructions actually read the **mapping stream** after prefix plus count. Existing tests had not exercised that tail. A new regression case used empty caller inputs and a recording mapping callback, making the correct data source unavoidable. The helper was corrected before the complete-trailer match was obtained.

Runtime table initialization was another necessary piece. The byte lookup table is initialized from a 131,072-byte source with an XOR reduction/mask. The word lookup destination was not simply file-backed bytes ready to read. It was uninitialized runtime storage populated from a compressed source.

The word table's source had LZMA properties followed by compressed bytes. Our own Python script used the installed standard LZMA library and an explicit expected output length to expand exactly 589,824 bytes. The reconstructed XOR initialization then produced the in-memory word table. Reading the destination RVA directly from the file had been the wrong approach; the PE parser's file-backed bounds check helped expose it.

The setup descriptor also had a concrete layout. Each selected descriptor was 378 bytes. Four marker bytes precede a 277-byte setup payload, followed by 97 packed bytes from which 258 three-bit finalization symbols are unpacked. The setup parser expands grouped packed symbols and preserves raw counters, a flag, a 64-byte pending buffer and a plain-state mirror into a `0x218`-byte state region. The larger provider context also preserves backup state for resetting after finalization.

At this point, parsing without a bounds error was only a layout check. It did not prove that the reconstructed word converter returned the correct state values.

## 23. The failed conversion diagnostic and its resolution

To test correctness beyond bounds, we reconstructed a forward uint32 encoder as well as the earlier reverse converter. The forward route builds two encoded shares, performs the reviewed combinations and normalizes them into a stored state-slot representation.

The first forward/backward diagnostic failed completely: **zero of 268 synthetic values round-tripped**. All decoded outputs were distinct, so the converter was not merely returning a constant. Comparing XOR differences also showed the discrepancy was not one fixed XOR mask. This was a real blocker and was documented as such; passing unrelated unit tests did not override it.

The resolution came from looking at the **caller**, not endlessly changing the common converter. The actual update routine applies a slot-specific shifted normalization operation before passing each stored 18-symbol word into the common reverse converter. Our diagnostic had omitted that caller-side operation.

The inverse state-writing bridge also uses a different final selector for each of the eight slots. The common conversion helper alone is therefore not a complete stored-slot conversion API.

After adding the first slot's missing bridge, all 268 values passed. We then traced all eight paired selectors rather than extrapolating from slot zero. The extended result was:

```text
268 synthetic uint32 values
x 8 independently selected state slots
= 2,144 forward/backward checks

2,144 matches; zero mismatches
```

The values included small boundaries, byte/word boundaries, signed/unsigned boundaries, the maximum uint32 and deterministic pseudorandom samples. No private state values had to be printed to obtain these results.

This was an important diagnostic lesson. The previous failed result did not prove that the original game routines were inconsistent. It proved that our reconstructed pairing was incomplete. Recovering the omitted normalization brought the model into agreement without guessing a key or adding a compensating constant.

It remained a forward/backward consistency check using shared reconstruction components, not an independently executed native oracle. The later five original-trailer matches supplied the stronger constraint that the whole assembled computation also agreed with pre-existing real output.

Current source links: [trailer-state.cjs](../research/trailer-state.cjs), [encoded-word-encoder.cjs](../research/encoded-word-encoder.cjs), and [check-state-conversion.cjs](../research/check-state-conversion.cjs).

## 24. Identifying and independently checking SHA-256

The update path had a useful plain-state branch. It can buffer 64 bytes, operate on eight ordinary 32-bit state words, and call a bulk compression routine. That gave a simpler target than reconstructing every equivalent encoded update operation.

The compression routine assembled big-endian message words, expanded the SHA-256 word schedule, used its round functions and feed-forward, and referenced **all 64 standard SHA-256 round constants**. The local check compared every constant, not just one familiar value. This identified the compression core much more strongly than “it processes 64-byte chunks and returns 32 bytes.”

An independent implementation, [sha256-continuation.cjs](../research/sha256-continuation.cjs), accepts an explicit initial state and already processed byte count. It was checked against Node's separate crypto implementation at fourteen lengths, including empty input, save-sized synthetic input and both sides of one-/two-block padding boundaries. A separate continuation test processed a 128-byte prefix first and confirmed that finishing with the correct byte count matched Node's full-message result.

The processed count is essential. Starting from a non-default state is not sufficient if the final padding encodes the wrong total bit length. The production descriptor's setup had already processed 64 bytes. Our continuation needed to include those in the length accounting.

With normalized state conversion available, we could compute a plausible inner result for each covered save range. It did not match the trailer directly, in reversed order, or after applying an ordinary second unkeyed SHA-256. Those negative tests were recorded honestly and directed attention back to the actual outer-finalization data flow.

We did not conclude “standard HMAC with recovered key.” The full encoded construction was still not reduced to that named formula, and its private parameters were not exported. A familiar compression core does not make every wrapper around it a particular familiar MAC.

## 25. Reconstructing the outer finalization

The final missing path packed encoded state words, combined them with saved finalization symbols, built another encoded input, invoked a larger outer routine, normalized its output, extracted nibbles and reversed the resulting 32 bytes.

Two input-unpacking helpers in that routine each begin with a 386-symbol transformation and split the result into 24 separate 18-symbol words with distinct selectors. The routine also contains encoded constants, repeated lookup combinations, buffer rearrangements, loops and output-packing helpers. Treating one of its static inputs as an ordinary raw key, or replacing the whole stage with another unkeyed hash, would have been speculation.

Instead of continuing to report another partial map as a solution, we built [outer-arithmetic-model.cjs](../research/outer-arithmetic-model.cjs). This is a **bounded instruction-level arithmetic model of reviewed static data flow**, not a native launch of the executable and not a general-purpose emulator or compatibility layer.

The distinction deserves precision. Earlier phases only inspected bytes and instructions. This final phase **evaluates a limited subset of the target's instruction semantics in our own JavaScript model**. It is therefore more than “reading assembly,” but it still does not load the executable as a Windows process or library, map its native code as executable, or give its code imports, syscalls, network or filesystem-write capabilities.

The model provides:

- A fixed allowlist of the reviewed packing, input-splitting, combination and outer procedures.
- Scalar register behavior with explicit 64-, 32-, 16- and 8-bit writes, including 32-bit zero extension.
- The needed address arithmetic and bounded static reads through the existing PE parser.
- Isolated writable buffer memory, separate from source executable bytes.
- The reviewed copy/XOR operations for vector buffers.
- Explicit signed/unsigned comparisons and the required fixed-loop control flow.
- A depth limit and operation budget.
- Calls to **our own** reconstructed binary/shifted/word lookup helpers.
- Rejection of non-allowlisted procedure calls and out-of-model writes.

Stack probing and the compiler's security-cookie check are explicitly modeled as infrastructure no-ops. They are not treated as digest arithmetic. The model assumes the chosen controlled buffer/stack environment is valid; it does not reproduce every possible native exception or operating-system condition.

The implementation was built incrementally. When the first run reached an additional packing helper, it stopped because that helper was not allowlisted. Its body/calls were inspected before it was added. A subsequent fixed concatenation helper was handled the same way. Unsupported behavior was not silently treated as zero or skipped to get an answer.

Another failure came from the **listing parser**, not the cryptography. A long instruction's immediate bytes wrapped onto a continuation line. The permissive parser interpreted a byte such as `c0` as an operation and stopped. Tightening parsing to the actual tab-separated instruction structure excluded byte-only continuation rows while retaining the full textual immediate from the instruction line. A synthetic regression test was added for that exact class of mistake.

After those corrections, the assembled generator performed this sequence:

1. Load/validate the fingerprinted local analysis input and reconstruct the required tables in memory.
2. Parse production setup, normalize all eight stored state slots, and decode their ordinary uint32 values.
3. Continue SHA-256 over the exact covered ASAV bytes with the stored 64-byte prefix count.
4. Re-encode the eight result words using the slot-specific inverse bridges.
5. Reproduce state packing and finalization-symbol input construction.
6. Evaluate the allowlisted encoded outer routine with its reviewed static input.
7. Apply the reviewed final word/symbol normalization.
8. Extract 64 nibbles into 32 bytes in the internal order.
9. Reverse all 32 bytes as the wrapper does.

The expected stored trailer was not used to generate the candidate. It was read afterward for comparison.

Every successful preserved sample followed 80,080 modeled operations and 9,134 lookup-helper calls. Those counts are useful reproducibility metadata, not a security theorem or proof of performance on all inputs.

## 26. What the five exact trailer matches prove

The first successful complete run reproduced the stored final 32 bytes on **all five** preserved story saves. A repeat run after extracting the reusable generator reproduced the same results. Additional checks changed a covered header byte, a covered protected-body byte and the expected trailer; those comparisons failed as intended.

The successful result was:

| Sample | Exact original trailer | Deterministic repeat | Header/body/trailer mutation checks | Original unchanged |
|---|---|---|---|---|
| SARC0000 | yes | yes | pass | yes |
| SARC0001 | yes | yes | pass | yes |
| SARC0002 | yes | yes | pass | yes |
| SARC0002-control | yes | yes | pass | yes |
| memory.dat | yes | yes | pass | yes |

This met the specific acceptance criterion we had set before claiming the trailer was solved: reproduce the pre-existing originals, not merely produce a deterministic 32-byte number or a round trip through our own functions.

The result supports **a local behavioral reconstruction for the selected provider and these samples**. It does not prove universal format compatibility, identify a canonical raw key, replace the need for correct serialization, or show that an edited save has been accepted by the game.

The generator was factored into [trailer-generator.cjs](../research/trailer-generator.cjs). It accepts the covered byte buffer and returns a digest plus value-free metadata. It does not write a save, connect to a console or export intermediate private state.

## 27. Returning to the controlled cash experiment

Once complete structured data was available, the original 338/317 experiment finally became useful at the correct layer. We parsed the full JSAV documents and compared numeric values at matching structural paths across the baseline, post-purchase and no-action files.

The search criterion was exact and deliberately narrow:

```text
same structural path in the three controlled documents
baseline value = 338
post-purchase value = 317
no-action control value = 317
```

There was **exactly one** such numeric candidate. In those files it appeared inside a four-column property table under CodeSaveBlocks, at an original row position of 552. Its value column is represented by hashed field names, not a friendly `cash` key.

We did not turn that original row number into a permanent offset. Array order and serialized sizes can change as the campaign progresses. The three parallel identity columns were examined alongside the value column. Their identity tuple was consistent for the candidate across the controlled samples.

The implementation fingerprints that ordered three-column tuple and searches for it dynamically. It does not include the cash amount in the identity, so changing the amount does not make the field unfindable. Missing identity, duplicate identity, uneven parallel columns or a value outside the supported range disables editing.

The fingerprint is a way to locate the same observed property row; it is **not proof of gameplay semantics**. It could still be a mirror/cache of another authoritative field. The exact transition and stable control make it a strong candidate for testing, not a substitute for testing.

The candidate can be located in all five preserved story examples. Their different observed values provide additional sample variation, but only the controlled purchase supplied the initial known causal relationship. The new campaign's reported bank structure has not been mapped by this experiment.

Current code: [story-editor-core.cjs](../research/story-editor-core.cjs) and [inspect-money-baseline.cjs](../research/inspect-money-baseline.cjs).

## 28. Editing JSON without corrupting unrelated data

Finding the candidate did not mean it was safe to parse the JSON, change a Number and stringify everything. JavaScript's ordinary JSON parsing can lose precision for large integer spellings. Whole-document serialization also changes whitespace, property formatting, escaping and lengths. The save has an explicit index pointing into that original byte stream.

The document editor therefore separates **inspection** from **rewriting**:

- The parsed root supports structural comparison and candidate location.
- A byte-level scanner records the original numeric token's start/end offsets and structural path.
- The rewrite replaces only the selected token's UTF-8 byte range.
- Untouched source bytes, including large integer spellings and string formatting, are copied verbatim.

The scanner operates on byte positions, not JavaScript string indices. That distinction matters for non-ASCII UTF-8 and for updating an index defined in bytes. Escaped quotes inside strings must not be mistaken for the end of a value. The synthetic tests include Unicode and escaped-string content.

The replacement API accepts only nonnegative safe integers for the current numeric edit operation. The cash layer narrows that further to the observed/user-reported 0–20,000 range. Duplicate or overlapping replacements are rejected.

Length changes require index repair. For each index record:

1. Add the byte delta of completed earlier edits to a later block's start offset.
2. Add the byte delta of edits wholly inside a block to that block's recorded size.
3. Reject an edit that crosses a block boundary.
4. Preserve unassigned index fields.
5. Re-align final decoded padding to the observed 16-byte boundary.

For example, replacing a three-digit token with a five-digit token increases its containing block by two bytes and shifts later block starts by two. It is not enough that the full JSON parses: indexed readers could otherwise read the wrong slices.

Validation was tightened accordingly. Every indexed JSON value must equal its corresponding CodeSaveBlocks/ScriptSaveBlocks object in the full parsed root, in order. All 82 matches were confirmed in the sample used to check that invariant. The new parser then enforces it for the supported representation.

One important remaining precision qualification is that parsed values are used for inspection and identity comparison, not as a lossless substitute for their original spelling. Future fields involving wide integers require specific review rather than assuming Number preserves every value.

Current code: [jsav-document.cjs](../research/jsav-document.cjs) and its [tests](../research/jsav-document.test.cjs).

## 29. Rebuilding the protected ASAV file

The full local writer has to reverse the decoded-body path in the correct order, update dependent header fields and generate the trailer only after the covered bytes are final.

The implemented rebuild is:

1. Validate the original header and active-end bounds.
2. Recompute/compare the original trailer **before body decompression**.
3. Decode the original protected body and validate its padding, raw LZ4 result, lengths and JSAV/index structure.
4. Locate the unique controlled cash candidate and record the original input fingerprint.
5. If the requested value is unchanged, return a complete byte-identical copy immediately.
6. Replace the selected numeric token and repair the JSAV index/alignment.
7. Compress the rebuilt JSAV with our independent raw-LZ4 encoder.
8. Add repeated-length padding. The current writer always adds 1–16 bytes, including a full block when already aligned.
9. Apply the same version-pinned counter transform from its original initial state.
10. Copy the original header and change only the established dependent length/checksum fields.
11. Append the newly generated trailer over the finalized header plus protected body.
12. Authenticate, decode and compare the completed output before returning it.
13. Recheck that the original input buffer/file fingerprint is unchanged before writing a separate output.

For this tested profile, the field relationships are:

```text
H = 0x170
J = rebuilt logical JSAV bytes
L = raw LZ4 bytes for J
P = repeated-length padding for L
B = protected bytes for (L || P)

header[0x18]  = H + length(L)
header[0x1c]  = H + length(J)
storedEnd    = H + length(B) + 32
header[0x168] = storedEnd

header[0x160] = recomputed header checksum
trailer      = reconstructed_integrity(header || B)
```

Header updates happen before trailer generation because the trailer covers the header. The physical output file can retain a larger original backing capacity, as with memory.dat. For an actual changed rebuild, trailing slack is zeroed instead of retaining stale protected bytes. For a no-op, the original whole file—including any remainder—is preserved exactly.

The raw-LZ4 encoder uses a bounded greedy match search with a 16-bit hash table and valid 16-bit backward offsets. It retains the final five input bytes as literals and starts the final match sufficiently before the end, respecting the independent decoder's format expectations. Repetitive data, noisy input and boundary lengths were tested.

Testing our own compressor only against our own decompressor could allow matching mistakes. We therefore added a separate verification path through the already installed **system liblz4**. An own Python wrapper accepts bounded bytes over a pipe, invokes `LZ4_decompress_safe`, and returns only a digest of the decoded bytes. That digest matched the original input for four synthetic cases and all five decoded private bodies.

The independent compressor happened to produce smaller packed data than the originals on this set. Byte-identical compression was never the editor's requirement. Correct decoded content, framing and integrity were the requirement; separate no-op handling supplies exact original bytes when nothing is meant to change.

Current code: [story-body-codec.cjs](../research/story-body-codec.cjs), [lz4-encode.cjs](../research/lz4-encode.cjs), and [story-editor-core.cjs](../research/story-editor-core.cjs).

## 30. The local acceptance tests for the editor

The main integration loop tested all five preserved story inputs at three requested amounts: **0, 999 and 20,000**. That made fifteen complete edited rebuilds, not just fifteen assignments to a JSON object.

For each test, the output had to authenticate, decode, parse and satisfy the structural invariants. The entire decoded root was compared with the original root adjusted at exactly the selected candidate path. This checked that no second decoded gameplay field changed as an accidental side effect.

Then the candidate was changed back to its original amount. The re-decoded root had to equal the original decoded root. This was a content round trip, not a demand that a different compressor reproduce all original packed bytes.

Additional checks covered:

- **No-op identity:** requesting the current value returns the whole original file byte-for-byte.
- **Input tampering:** a modified protected-body input is rejected instead of edited.
- **Range rejection:** an amount above 20,000 is rejected.
- **Row relocation:** moving the corresponding entries across all parallel columns still locates the same identity at its new index.
- **Ambiguity:** copying the identity to a second row causes editing to fail closed.
- **Original preservation:** re-read original files retain their recorded fingerprints.
- **Autosave capacity:** the backing file remains 2 MiB where the rebuilt active content fits.

These tests completed successfully. The current synthetic unit suite contains **34 tests**, while the private integration checks are a separate evidence set. It would be misleading to combine these into an invented larger “unit test” count or say GitHub CI re-ran private saves that were never uploaded.

One actual command-line output was also created for review, with its audit manifest. It changed the older Coming Home control's candidate from 317 to 20,000. It was explicitly labeled test-only and was not substituted for the maintainer's newer 77%-progress campaign.

## 31. The Windows interface and the real PATH bug

The visible editor is deliberately small: a native Windows form with an open-file control, a displayed cash candidate, a bounded numeric selector, a “Create test copy” button and an output-folder button. It does not contain the cryptographic computation itself.

The layers are:

```text
PowerShell / Windows Forms
    -> Node command-line entry point
        -> validation / candidate matching / byte-level document edit
            -> compression / body transform / header / trailer generator
```

The CLI accepts an explicit file, performs size/layout checks and writes only into its dedicated output directory. Output names include a unique suffix and use exclusive creation flags. Each local manifest records original/output hashes, before/after candidate values, local-validation status and the lack of console-acceptance verification. Input fingerprints are rechecked before saving.

Private JSON parsing failures are not echoed verbatim to the user, because such error text can contain private save snippets. Expected user mistakes receive concise messages; unknown validation failures produce a general unsupported/invalid result rather than dumping content.

The first hidden UI smoke test constructed the controls and verified the PowerShell-to-Node engine connection. It did not click through every visible file dialog or establish the Explorer launch environment.

the maintainer's actual desktop launch exposed the missing assumption: the assistant's development process could resolve `node`, but the Windows process launched from Explorer could not. The error happened **before the save was read**. It did not show that New Save 3 was corrupt or that the codec failed.

The fix added explicit runtime resolution through PATH, an ignored local runtime configuration, common Node installation locations and optional available runtime-package discovery. The exact machine-specific runtime path stays local and is not in GitHub. A subsequent hidden smoke test deliberately removed Node from PATH and opened the selected New Save 3 control file successfully, with its expected 317 candidate and valid trailer.

A separate earlier smoke-test issue had also been corrected: evaluating the launcher as arbitrary expression text lost the script-directory context used to find the engine. The launcher now has an explicit `NoShow` test mode, and the smoke test loads it through the normal script mechanism. Labels were made ASCII-compatible to avoid Windows PowerShell 5.1 encoding-dependent display problems.

the maintainer later reported that test copies appeared in the output folder through the real interface. That is evidence for actual UI-driven file creation, not proof that the balance changed in-game.

Current interface source: [Launch.ps1](../editor/Launch.ps1), [editor.cjs](../editor/editor.cjs), and [smoke-test-ui.ps1](../editor/smoke-test-ui.ps1).

## 32. What is actually in GitHub

the maintainer asked for a private repository with documentation and changelog tracking. A **separate source checkout** was prepared rather than running `git add` over the large research workspace or personal saves directory.

An explicit allowlist copied the owned reconstruction/editor source, synthetic tests and synthetic LZ4 fixtures. The source layout was reorganized into `editor`, `research` and `header`. Machine-specific paths were removed from the archived code, including the hardcoded local WSL helper path. The original operational installation was left unchanged.

The initial private repository contained 49 files and included README, changelog, architecture, validation, setup, roadmap, research log, security rules, contribution guidance and credits. The source audit rejected private input/output directories, runtime executables, save files, disassembly listings, machine runtime configuration, likely credential patterns and unexpected large files/symlinks.

Creation used the owner's existing authorized Git authentication. Credentials were not printed, embedded in a command-line URL, written into source or uploaded. The repository was created **private from the start**, rather than made public and switched afterward. Uploaded visibility, commit identity and excluded-asset count were checked after the push.

The initial source-archive commit is `0db09cf9ae380ecd66aa81e54fa98766189cac7c`. Its source-only GitHub Actions run succeeded. That run checked the repository audit and the same synthetic tests; it did not have access to private fixtures or runtime assets. This detailed retrospective is a later documentation addition and should not be confused with material already present in that initial commit.

The repository is a source/documentation archive, **not a standalone redistributable binary release**. Running the current real-save generator still needs separately held private analysis inputs and reviewed listings. Its current successful behavior must not be presented as “clone this and it works with no other files.”

the maintainer is credited for project direction, hardware/save ownership, controlled gameplay evidence, collaboration and user feedback. Arty is credited as the Codex AI assistant providing research, implementation and tests. The record does not turn AI assistance into a separate human contributor or grant rights in third-party game material.

## 33. External-source mistakes and the correction

The surrounding research included public searches for existing save tools. Absence from a search was never proof that no other person had private or unpublished progress. Commercial advertisements were not independent restoration demonstrations.

A later web-tool result appeared to provide detailed upstream GTA VI money-editor source and README features. The assistant initially described those as concrete public-code evidence. the maintainer challenged the result and supplied a conflicting direct GitHub investigation from independent review.

A direct GitHub-connector recheck then returned 404 for the two cited GTA VI source paths, and the accessible current README did not corroborate the alleged editor features. The sanitized publication snapshot and its metadata were confirmed. The earlier claim that those paths established public implementation was **retracted**.

The discrepancy's cause is unknown. This document does not invent an explanation such as a secret branch, deleted source, a private implementation or a cache being definitively responsible. Nor does missing current public code prove that a service never had private code.

No alleged implementation from those disputed results was imported into our editor. Our local body/trailer/editor results are supported by their own code and preserved-sample comparisons.

The proper priority conclusion remains narrow: that investigation did not establish a publicly reproducible competing editor. It also did not establish that our prototype was first. The evidence needed for a meaningful public claim includes functioning edits and gameplay restoration, not merely an advertisement, a failed URL, or confidence based on time spent.

## 34. The unresolved work and the next decisive experiment

The local reconstruction and prototype milestones are real. The remaining questions should not be blurred into “everything is solved.”

### 34.1 Fresh current-campaign input

The available controlled exports were the earlier campaign samples. the maintainer reported reaching 77% later, but the local baseline did not include a fresh exported copy of that state. The next export should go into a new folder with its own untouched local backup and recorded visible cash/bank amounts.

Before changing anything, the prototype should open that export and show a unique candidate matching the actual cash amount. A match would extend field-location evidence; a mismatch should disable editing and trigger investigation rather than changing a guessed path.

### 34.2 Bank evidence

The bank is not safely identified from the old stash amount alone. A useful experiment is:

1. Save a baseline and record both visible cash and bank balance.
2. Make a known-size deposit or withdrawal without unrelated spending.
3. Save into a separate slot and record both resulting amounts.
4. Make a no-action control resave into another preserved slot.
5. Compare decoded structures while accounting for incidental state changes.

This produces an expected paired change in cash and bank, plus a control. It is stronger evidence than searching a large document for one coincidental occurrence of a balance. Until then, bank editing remains disabled.

### 34.3 Authoritative cash semantics

The current field could be authoritative, a display mirror, cached state, or one member of a related state group. Local integrity generation cannot decide that by itself. The edited file must be loaded in-game, its visible balance checked, and the game then saved/reloaded to test persistence and consistency.

Testing 0 locally is not proof that the game accepts every boundary behavior, such as removing or recreating a money-related item. The user-reported 20,000 cap is enforced in the prototype, but the current checks do not prove all platform/build/campaign rules.

### 34.4 Container restoration

The return workflow is another layer. The rebuilt inner ASAV must be paired with the correct exported container metadata, repackaged/re-encrypted with the existing platform tooling, and returned to the intended account/console under separately reviewed instructions.

An untouched local backup should be kept independently of cloud sync. Cloud synchronization is not a guarantee that an older backup cannot be replaced. The older Coming Home test copy is not the newer 77% campaign and must not be restored casually as if it were.

The target must actually run the installed GTA VI build. We have not established that the 13.60 research console can do that, and the Xbox candidate's useful format behavior is not a new-PS5-jailbreak demonstration.

### 34.5 Standalone packaging and platform support

The code still depends on privately held executable-derived parameters and reviewed static listings. A standalone release needs a separately reviewed dependency/packaging approach; this repository does not distribute those assets.

Xbox and PC support require their own sample provenance, framing/parameter checks and acceptance tests. The fact that an Xbox-related candidate supplied behavior matching five PS5 saves is an important empirical bridge. It is not universal cross-platform support or a working PC port.

## 35. Evidence matrix, terminology and review checklist

### 35.1 Compact milestone matrix

| Milestone | Input/evidence | Result | What it did not establish |
|---|---|---|---|
| Export inspection | Platform-decrypted SARC payloads | ASAV layout and opaque story body observed | Story decryption |
| No-action control | 317 purchase/control pair | Large changes without deliberate cash change | Money offset in encoded bytes |
| Header inversion | Seven stored checksums and header bytes | Exact signed-byte Jenkins formula | Body integrity or cash semantics |
| Differential models | Five story samples, aligned/shifted comparisons | Position-dependent correlations | A recovered keystream/key |
| Candidate static bridge | Header routine, literal seed and mode mapping | Reason to trace candidate save code | Whole-program authenticity or PS5 executable equality |
| Provider trace | Selectors, factories, vtables and wrappers | Concrete selected update target | Compression or cipher identity from argument size alone |
| Counter/primitive model | Reviewed code plus local parameters | Valid body inverse across five inputs | Standard-library cipher naming |
| JSAV validation | Full documents, lengths and 82 indexed blocks | Five coherent structured decodes | Edited-save generation |
| State bridge correction | 268 values across eight slots | 2,144 round-trip matches | Independent native oracle |
| SHA core tests | All 64 constants; Node crypto comparisons | Correct compression/continuation model | Entire final trailer formula |
| Encoded outer reconstruction | Reviewed fixed procedures and private in-memory tables | Five exact original trailer matches | Game acceptance of modified data |
| Controlled field comparison | 338 -> 317 -> 317 | One dynamically identified candidate | Authoritative balance semantics |
| Full local rebuild | 15 edits across five originals | Exact requested decoded field changes with valid structure/integrity | Console restoration/persistence |
| Windows feedback | Real PATH failure; reduced-PATH smoke test | Launcher resolution fixed | Every desktop environment |
| Private source archive | Allowlisted files, source audit, remote verification | Private backup/docs and passing synthetic CI | Standalone release or world-first status |

### 35.2 Terms that should not be used interchangeably

- **Transfer decryption:** processing transport records. The resulting save container can remain encrypted.
- **Container decryption/export:** exposing game files from the platform save image. The game's ASAV body can remain protected.
- **Story-body decode:** obtaining coherent logical JSAV from protected/compressed body bytes.
- **Header checksum:** integrity of the selected header range, not the body.
- **Trailer generation:** reproducing the final 32-byte computation over header and protected body.
- **Counter round trip:** applying the same XOR stream twice to unchanged data. Useful but insufficient alone.
- **Document reverse edit:** changing a selected numeric value back and restoring the original decoded document.
- **Byte-identical no-op:** returning the exact original file when no value changes.
- **Local rebuild validation:** authenticating/decoding the generated file and comparing its structure/content.
- **Gameplay acceptance:** successful load, expected behavior and persistence through another save/reload.
- **Source-only CI:** synthetic tests on repository material, without private game files or saves.

### 35.3 Suggested independent review review order

1. Read the status boundary at the top and section 34 before treating this as a finished game-tested editor.
2. Follow [docs/ARCHITECTURE.md](ARCHITECTURE.md) and [story-editor-core.cjs](../research/story-editor-core.cjs) through input authentication, candidate search and output validation.
3. Inspect [jsav-document.cjs](../research/jsav-document.cjs) for byte-offset correctness, large-number preservation, range repair and indexed/full-root agreement.
4. Inspect [protection-model.cjs](../research/protection-model.cjs) for transform ordering, counter carry and chunk-boundary behavior.
5. Inspect [trailer-generator.cjs](../research/trailer-generator.cjs), [trailer-state.cjs](../research/trailer-state.cjs) and the arithmetic model for missing normalization, ordering, assumptions and allowlist bounds.
6. Read the synthetic tests as tests of implementation properties, not as proof of a target algorithm by themselves.
7. Read [docs/VALIDATION.md](VALIDATION.md) for the separate known-original and edit/rebuild evidence.
8. Check whether the money candidate could be a mirror and design the smallest controlled gameplay test that distinguishes that case.
9. Review a fresh current-campaign export and a controlled bank comparison before broadening edit support.
10. Review container/account/destination handling separately before authorizing restoration.

Cloud review should not require uploading private saves, account metadata, executable material or lookup tables. Requests for further evidence should first specify the exact missing relationship and whether an aggregate local check can supply it.

### 35.4 Where the historical record came from

This narrative was assembled by reading local reports with these roles:

- Original Garlic source/workflow review and exported-payload inspection.
- First ASAV format map and same-slot no-action comparison.
- Decoder passes recording failed framing, authentication and differential models.
- Deep checksum-recovery result and its actual inverse-mixing implementation.
- Candidate PE inventory and static header/provider/serializer traces.
- Writer-boundary and vtable-correction follow-ups.
- Body-protection reconstruction results and five-sample structural checks.
- Four trailer-reconstruction passes, including the explicitly failed diagnostic and its correction.
- Exact-trailer verification record and the final generator/checker source.
- Baseline editor result, unit tests, private integration result metadata and Windows launcher fix.
- The source-only GitHub packaging, privacy verification and successful initial CI run.

Most original scratch reports, private result files and all proprietary runtime assets remain local. Their absence from GitHub is deliberate. This document consolidates the reasoning and sanitized outcomes so the maintainer and independent review can review the full route without needing those private files copied into the repository.

### 35.5 Final state of the project at this document's cutoff

We did not jump from a random encrypted file to a working balance edit through one lucky guess. The route was cumulative: preserve evidence, separate layers, learn the header, reject weak decodes, obtain stronger code evidence, correct ownership/framing, reconstruct the body, fix encoded-state assumptions, match the trailer, then return to the controlled gameplay data and build a byte-preserving writer around it.

The strongest completed achievements are the five coherent body decodes, five exact pre-existing trailer matches and fifteen complete local edits with narrow decoded changes. The most important remaining uncertainty is not whether the prototype can produce a locally self-consistent file; it is whether the chosen field is authoritative and the complete restored save behaves correctly in the game.

That is the next milestone to prove—not a result this document claims has already happened.

## 36. External audit and correction of the original cash interpretation

The next investigation compared public editor implementations, available Garlic infrastructure, the original decoded samples and the current local reconstruction. This materially changed the interpretation of the original controlled candidate. The candidate that tracked 338 to 317 to 317 was a statistic mirror. It was useful evidence, but editing that field alone did not establish an authoritative inventory edit. The historical editor and its field-only outputs remain preserved as research; they are not promoted to accepted restores.

The public CoreyLyu76/gta6-save-editor repository supplied identifiable inventory and account leads. The reviewed snapshot was ae577a5ae6168e04953594868f4ee1d0e3042287. Its earlier release history also invalidates any assumption that lack of an earlier search result demonstrated project priority. The independent ASAV reconstruction here remains a separate result, but this record makes no first-in-the-world claim.

The relevant inventory representation comprises six parallel arrays for item GUIDs, parent indices, item IDs, slot IDs, quantities and equipped flags. Parent indices refer to an exact GUID table. Item rows also require registration records. The early approach could not simply search for a balance and assume the first match was authoritative. Inventory relationships, registrations, statistics and ledgers all needed corroboration.

One methodological issue was comparing wide GUIDs through ordinary JSON-parsed JavaScript numbers. Their integer values can exceed exact IEEE-754 precision, causing distinct identifiers to appear equal. The new reader uses original decimal tokens for identifier comparison. Another missed opportunity was relying on stable field positions or same-row comparisons when inventory rows had moved. The current research uses identifiers and relationships rather than a fixed cash offset or statistic array position.

An independent early-campaign experiment changed the currency row, the controlled statistic and a combined-money mirror, while preserving unrelated numeric tokens. That was an intermediate experiment, not a universal mapping of later bank semantics. The later current-campaign sample was necessary before enabling shared checking and savings controls.

## 37. Fresh campaign sample and shared-account mapping

A new original slot-10 export contained decoded JSAV, a game-level chives.dat sidecar, and supporting sce_sys files. The sidecar embedded the original ASAV at offset 32. The reconstructed codec decoded this sixth original ASAV byte-identically to the supplied JSAV. A later local container decryption produced the same original ASAV byte-for-byte, linking the web and local export paths without relying on filename coincidence.

The observed original balances were 10,000 cash, 17,860 checking and 354,800 Family Savings. These figures are retained as experimental observations, not personal account identifiers. The campaign profile contained 21 inventories and 82 indexed JSAV blocks. Shared bank and savings structures were in one inventory, and the mapped active wallet was in another. This observed layout does not establish that inventory order identifies protagonists in all saves.

Checking used a registered account root, four registered container rows and one occupied currency child. Savings used registered 5,000, 95,000 and 400,000 capacity containers, with quantities totaling 354,800; an existing 500,000 box had no currency child. The capacities and slot identifiers were external research leads corroborated where possible against existing local rows. Empty containers must not be confused with absent account roots, and an inactive zero statistic does not prove that a character's wallet is absent or empty.

The statistics table contained distinct character codes and stale inactive values. The active checking statistic agreed with 17,860, while another cached value was 18,028. The combined-money statistic agreed with active cash plus shared checking. Both savings mirrors agreed with 354,800. The writer therefore does not force every statistic for both characters to an identical number.

The ledger investigation was especially important. Checking and savings were globally continuous across owner changes. Taking the last transaction belonging to a presumed inventory owner would select an old balance. The implemented policy updates the final global entry's balance and transaction delta consistently, preserving the earlier ledger history. This policy has one profile's gameplay evidence; it is not a complete reconstruction of all possible transaction semantics.

## 38. Consistent writer, local tests and the interface defect

A separate development writer was built instead of overwriting the historical cash prototype. It validated the mapped wallet, shared account roots, currency children, parent registration, statistic identities and ledger arithmetic before editing. It preserved original number spellings and exact GUID tokens, repaired indexed offsets and lengths, rebuilt compression and protection, regenerated the header and trailer, and decoded/authenticated the result again.

Initial checking and savings edits were restricted to reductions. Nine full local test cases covered reductions, cash boundaries, combined changes, unchanged originals, byte-identical no-op output and malformed-state rejection. These tests were local generated-file evidence, not game acceptance.

The visible interface then exposed an Invalid options error. PowerShell had combined a flag and value into a single argument because of expression precedence in an array expression. The fix emitted each option and value separately through a shared argument builder. A UI-to-engine test using the exact requested 9,900 / 17,760 / 354,700 balances succeeded and created separate outputs. The error was not caused by out-of-range values or save corruption.

The interface was also corrected to label shared checking, shared Family Savings and the profile's mapped wallet explicitly. The change avoided representing the shared bank as a separate per-protagonist account or silently inventing the other character's wallet mapping.

## 39. The missing CoW image and successful container round trip

The first packaging attempt retained sce_sys and metadata but lacked the original PS5IMAGE. Local GarlicMgr rejected CoW encryption with a specific missing-image error. That failure was a packaging-layer issue, not evidence against ASAV integrity generation.

The original encrypted slot-10 backup was submitted as a copy to local GarlicMgr. Its complete export included the encoded game file, sce_sys files, chives.json, PS5IMAGE, PS5KEY and PS5PARAM_SIZE. The original game file exactly matched the ASAV embedded in the web export. A replacement ZIP preserved all companion entries and replaced only SARC0010 with the verified edited ASAV.

Encryption then completed and returned an encrypted PS5 container ZIP. Before restoration, a copy was decrypted again. Its recovered ASAV was byte-identical to the intended edited output. The original param.sfo, keystone and icon were also byte-identical. This established that the platform round trip preserved the edited game file and supporting metadata; it did not alone establish that the game would accept the edit.

The retained PS5IMAGE and PS5KEY are private runtime/export artifacts. They are not copied into this repository or a public testing package. Likewise, the game-level chives.dat wrapper is not interchangeable with PS5 container geometry or key sidecars.

## 40. Transfer-path investigation and retail acceptance

GarlicTransfer initially showed an empty local library because its configured profile root did not point to the preserved download. Selecting the appropriate source profile made the downloaded game entry visible. A separate working profile was created and hash-verified, but later settings showed that the active profile paths still referenced the original latest-save profile. The imported edited file appeared there rather than in the intended working copy. This was a real backup/workflow defect, and an original encrypted image remained recoverable from the preserved local export.

The selected local replacement picker accepted a ZIP filename, but source review showed that replacement copied the selected bytes directly rather than extracting a container. A raw extensionless encrypted container was therefore prepared explicitly. Accepting a file in a dialog was not treated as proof that the format had been interpreted correctly. The new workshop makes the correct replacement path explicit and verifies it before copying it to the clipboard.

The upload selection operated at the game entry level with multiple save files, not the individual slot granularity assumed in earlier instructions. This affects both transfer staging and the deletion scope on the destination console. The workflow now requires checking Library, Upload and metadata paths, full recovery copies, and the actual deletion prompt instead of promising one-slot replacement semantics.

After restoration, the maintainer initially reported unchanged balances. A file-path mismatch was investigated as a possible cause. The subsequent settings screenshot showed both active paths referencing the profile containing the edit, so the assistant withdrew that explanation rather than presenting it as established. The actual cause was loading the autosave instead of the edited manual slot.

On manually loading the target slot, the maintainer supplied a screenshot showing 17,760 checking and 9,900 cash, then reported that savings was also correct at 354,700. The maintainer manually saved and reloaded and reported all edited amounts persisted. This is the first recorded retail gameplay acceptance for the consistent writer in this project. It is a single maintainer's test, not independent multi-user validation or a native execution test performed by CI.

## 41. Experimental increases and revised capacity understanding

The increase build preserved the earlier writer and added independently authored append-only inventory construction. Six main arrays remain synchronized. New rows have collision-checked signed 64-bit GUIDs, exact parent references and registrations. Existing GUID tokens are not rounded or regenerated. Unrelated existing numeric tokens and inventory sublists remain unchanged.

Checking retains the original occupied box bounded at its observed 17,860 quantity because that box's capacity is unidentified. It can use an existing 85,000 box and append 400,000, 500,000 and 1,000,000 boxes and currency children. Savings can add a currency child to the existing empty 500,000 box. The independent implementation uses external identifier/capacity leads but does not copy the public editor's GPL implementation.

Sixteen local cases passed, including 2M checking and 1M savings targets. These checks establish generated-file structure/integrity and intended values. They do not imply that every cap was gameplay-tested. One actual encrypted test was verified as 20,000 cash, 2,000,000 checking and 490,000 savings; its savings value must not be inflated in the documentation to a million merely because that was an available editor cap.

The maintainer later supplied a screenshot showing 2,001,000 checking and a displayed limit of 3.9M, followed by a report that saving/reloading preserved the balance. This narrows the earlier guide-based inference: 2M is not a hard ceiling in that edited state. Added money containers may affect displayed capacity, but that causal explanation has not been independently established. The editor retains conservative 2M checking and 1M savings controls pending additional capacity research. The 1M savings policy is not asserted as a game maximum.

## 42. Guided workshop and verification state

A new workshop combines source backup, change review, packaging, local encryption, downloaded-container extraction and return-file verification. It keeps the earlier builds intact. Changing an amount invalidates the current output/verified state. A failed verification does not enable the transfer-file-path action. The copied extensionless file is rehashed against the verification record before its path is exposed for replacement.

The local processing step requires an explicitly confirmed private IPv4 HTTP endpoint and rejects public destinations, hostnames, unexpected paths and redirects. Account-resigning parameters are omitted. It uses temporary processing on the modded PS5 but makes no retail restoration/import call. The workflow's real integration test used an unchanged original copy and recovered exactly 10,000 / 17,860 / 354,800 with all 82 indexed blocks and supporting metadata preserved. No retail restoration was performed by that integration test.

This operational convenience does not remove the codec's private runtime dependencies. Nor does it automate retail acquisition or GarlicTransfer's upload deletion/staging decisions. Public remote processing is a possible alternative to a user-owned modded console in the broader Garlic ecosystem, but this editor's complete online-only route has not passed the same end-to-end test. Public wording must distinguish the stock game-playing console from the separate local processing console used in the demonstrated workflow.

## 43. Closed-test read-only baseline

The next generalization milestone is a standalone read-only checker. It discovers inventory/account candidates without requiring 21 inventories or assigning protagonists from positions, checks exact GUID uniqueness and parent indices, reports registrations and recognized accounts, examines statistic IDs/character codes and ledger arithmetic, and never approves an edit or restoration. Unknown or ambiguous layouts are surfaced as findings.

The checker imports no private codec inputs, game executable, save writer or network client. It requires decoded JSAV or ZIP entries already containing JSAV. Encoded ASAV and encrypted containers are intentionally unsupported. Windows ZIP ingestion uses bounded candidate counts/sizes, random temporary paths and explicit cleanup, rather than extracting archive paths to arbitrary destinations.

Its report is an allowlisted summary. It omits PSN/account IDs, source paths, exact GUIDs, keys, original save contents and raw exception text. It does include gameplay balances and structure counts, so users should review it before sharing. A report is not a guarantee of anonymity and is not an anonymized version of the original save.

Ten synthetic tests passed, covering invalid/encoded inputs, non-fixed inventory counts, exact unsafe integers, duplicate GUIDs, parent errors, ledger errors, private canaries and unchanged inputs. Six preserved local decoded samples were inspected. No externally supplied tester save has yet been evaluated. Selected testers should initially share reports plus game version, campaign stage, active character and displayed balances; raw samples need separate consent and private handling.

## 44. Release preparation and current boundary

The repository now includes allowlisted current workshop/checker source and updated setup, architecture, validation, credits, roadmap and release-readiness documentation. Personal names and machine-specific operating paths are generalized in the current tree. Private source assets, saved outputs, account data and runtime configuration are excluded.

Older Git commits can still expose historical attribution and obsolete documents. Current-tree cleanup is not historical erasure or a guarantee of anonymity. A future public release requires a history/identity decision, a dependency/license review, arbitrary-save compatibility work and explicit publication approval. The repository remains private, and this work creates no public release or release-date promise.

The strongest current conclusion is: this project has a locally reconstructed processing pipeline, one mapped profile with maintainer-reported retail persistence, an experimental increase implementation with limited gameplay evidence, and a read-only baseline for collecting broader compatibility evidence. It is not yet a universal public save editor.

## 45. External persistence report and clean-history public prerelease — 2026-11-25

An externally supplied Xbox-labelled ASAV version-2 file was decoded with the existing reconstructed body transform. Its header formula and original 32-byte trailer matched. The decoded JSAV had 38 code and 44 script blocks, in the same ordered section layout as the PS5 source. This extends the local reconstruction evidence beyond the original PS5 samples without asserting every platform/build uses the same provider.

The team prepared a rebuilt control from that source, verified byte-identical decoded contents, and separately prepared a PS5 free-roam probe by changing only ASAV version, header checksum and trailer. The original PS5 protected body remained unchanged. The maintainer confirmed the PS5 source opens directly into free roam, but it is a late-campaign fixture, not an early save. Both sources were preserved. No game binary was executed by these checks.

With permission, the external tester is credited as **0xSavior**. They reported the rebuilt control read fully, the free-roam probe loaded into a daytime street and ran six minutes without errors, and the imported state subsequently saved and reloaded. Rendering remained incomplete. The research team did not independently execute their build, whose version was sender-reported. The evidence supports the particular load/save/reload test, not universal conversion, fresh Xbox-side money edits or retail Xbox compatibility.

The external sample and all derivatives remain private by the tester's explicit request. The private handoff is not part of this repository or its release artifacts. No known identifier match in a scan establishes anonymous game data; unknown fields can still identify or fingerprint a source.

Publication is now authorized for a new clean-history source repository and the runnable read-only checker, with MIT for independently authored code. The old private research history is not pushed into the public repository. Personal names and machine-specific operating data are excluded, except the authorized public tester handle and the inherently visible hosting account. No saves, account IDs, key sidecars, private executable inputs or proprietary table payloads are included.

The checker received bounded-input and report-output safeguards before publication. The writer remains profile-specific experimental source and requires separately held inputs; the public release must not imply a standalone universal editor. See CROSS-PLATFORM-TEST.md and RELEASE-READINESS.md for current evidence and limitations. These current statements supersede historical sections saying there was no external tester or publication authorization.
## 46. Generalized decoded writer and consent-based online processing — 2026-11-25

The new decoded editor removes the earlier fixed inventory-count/order, fixed character-code and original checking-value assumptions. It discovers account roots and registered parent/container relationships across inventories, then corroborates a selected wallet with the current document's statistics and global ledgers. Protagonist names are not inferred from inventory positions. Exact original GUID tokens are preserved. Ambiguous ownership, multiple account roots, unsupported scalar/slot/capacity relationships or inconsistent ledgers refuse edits.

A later gameplay-resaved input showed that its checking statistic described a unique subset of account currency containers rather than the full inventory total. The writer now recognizes a unique corroborated subset, preserving that mirror scope during allocation; it does not blindly set every statistic to the shared total. This remains an experimentally supported rule, not proof of all game semantics. Supported item/slot capacities are mapped separately from the user's balance. The bank policy stays 2M, wallet policy 20,000 and savings policy 1M. Tests cover bank increases from zero, decreases, maximums, varied balances/codes/inventory positions and repeated edits.

The decoded writer needs no game executable or private codec inputs. It exports JSAV and, when a source ZIP exists, preserves that user's metadata while replacing only the selected game entry. Protected ASAV generation and PlayStation container encryption remain separate operations. The public tool now offers optional GarlicSaves processing with an explicit upload approval and the user's own API key. No shared credential is embedded or stored by the UI.

The owner separately consented to testing their own slot-11 copy online. The first live service result preserved the intended edited JSAV but changed the account binding by reversing account bytes. Verification rejected it. The correction uses the original SFO's wire bytes for that API and checks returned metadata rather than assuming the parameter's display convention. The corrected encrypt/decrypt result preserved the exact edited JSAV and original SFO, keystone and icon. The actual GUI orchestration repeated that verification successfully. No console restoration or gameplay test of the new generalized output has occurred, and no external tester's private sample was uploaded.

The combined source-only suite has 64 tests. Additional private checks covered four local ASAV zero/max rebuilds on two sources; the independently extracted decoded-editor package worked without private configuration. These results justify an experimental preview, not support for every save. The third-party service and API can change; return verification and deliberate restoration remain required.
