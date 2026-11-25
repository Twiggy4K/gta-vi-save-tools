# Third-party notices and scope of MIT

MIT applies to the independently authored code and documentation included in this repository. It does not license external products or materials referenced by the research.

- Garlic Save Manager and GarlicTransfer are separate projects; their implementation is not bundled. Users must follow their respective licenses and requirements.
- CoreyLyu76/gta6-save-editor was reviewed at ae577a5ae6168e04953594868f4ee1d0e3042287 for public inventory/container identifier leads. No implementation code from that GPL-3.0 repository is included. Existing identifiers were corroborated against private local samples; the writer and append logic are independently authored.
- SaveRift research was reviewed separately. No upstream SaveRift parser/catalog implementation or assets are bundled here.
- The independent LZ4 codec follows the public format. System liblz4 was used only as an external local compatibility check.
- The Windows x64 portable editor includes the official unmodified Node.js 24.22.3 node.exe. Its complete upstream LICENSE, including bundled third-party notices, is included at decoded-editor/runtime/LICENSE. Source: https://nodejs.org/dist/v24.22.3/node-v24.22.3-win-x64.zip ; official archive SHA-256: e612af99f626ab415ea225af6bce5c971feb448cb5cae250bb1c3fa50c5f7d9f. Source-only and checker downloads still require a separate Node.js installation. Windows/.NET, PowerShell, Python and optional WSL retain their respective terms.
- No game executable, game asset, private save, account metadata, sidecar key, extracted lookup payload or raw disassembly is distributed or licensed by this project.

The project is unofficial and makes no claim of affiliation with any platform holder, game publisher or port developer.
