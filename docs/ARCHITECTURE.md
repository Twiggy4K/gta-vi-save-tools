# Architecture and save layers

The transfer protocol, PS5 container and GTA VI game-body formats are distinct layers.

```text
Retail save -> GarlicTransfer -> encrypted PS5 container
  -> platform decryption -> ASAV game body
  -> header/trailer authentication -> body transform -> raw LZ4 -> JSAV v3
  -> inventory/account discovery + supported-layout checks
  -> inventory quantities / exact GUID-parent registrations / statistics / ledgers
  -> indexed-range repair -> LZ4 -> protection -> header/trailer generation
  -> matching original container metadata + PS5IMAGE/key sidecars
  -> local GarlicMgr encryption -> download -> decrypt-check a copy
  -> verified extensionless container -> deliberate GarlicTransfer restoration
```

## Components

- `checker/`: independent read-only JSAV inspection and privacy-filtered reports. It has no private codec, network client or save writer.
- `workshop/`: current sample-specific money writer, append-only container expansion, native interface and optional local encryption/verification orchestration.
- `research/`, `header/`: reconstructed codecs, exact numeric-token parser and historical experiments. Private runtime inputs are absent.
- `editor/`: historical statistic-only candidate editor, superseded for restoration purposes.

## Invariants and current limitations

ASAV integrity covers header and protected body through storedEnd minus 32 bytes. Rebuilt output is authenticated and decoded locally. No-op output is byte-identical. JSAV offsets/lengths must agree with all indexed documents. Existing wide GUID tokens must remain exact; whole-save JSON reserialization is avoided.

The current writer checks the known inventory profile, registration, parent links, statistic IDs plus character codes, and globally continuous bank ledgers. Larger amounts may append synchronized inventory rows, exact parent references, unique GUIDs and registrations. The occupied checking box with unknown capacity is conservatively bounded by its observed original quantity; this is an acknowledged sample-specific assumption, not a universal game rule.

Accounts are shared while wallets are character-specific, but inventory order alone does not prove protagonist ownership across arbitrary saves. Inactive cached statistics are not blindly synchronized. The checker reports candidates and uncertainty instead of applying the writer's fixed character mapping to other saves.

The workflow retains original account metadata, verifies supporting export/body correspondence, backs up sources and verifies the returned encrypted file. It can create temporary files/mounts on the modded PS5 after confirmation; it does not call retail restore/import APIs.

GarlicTransfer supports remote processing as an alternative to a user-owned modded console. However, the current workshop automates only the locally tested GarlicMgr route; online-only packaging/encryption has not passed this project's end-to-end acceptance test. Private runtime dependencies remain unresolved for a redistributable editor.
