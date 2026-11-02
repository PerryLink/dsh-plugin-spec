# C4 matrix review — engines-first, not peer-first (2026-11-02)

> 非独立 reviewer · 非官方 · 非认证 · 无 `verified`。Review of `C4-MATRIX.md` / `BOOST-B5-B6.md`.

## Matrix result

| carrier | compatible | incompatible |
|---|---|---|
| peer-only | add 0, boot | add 1 (reject) |
| engines-only | add 0, boot | add 1 (reject) |
| both | engines compatible + peer incompatible → add 0, boot (**peer ignored**) | engines incompatible + peer compatible → add 1 (reject, **engines wins**) |

## Conclusion

1. Both carriers are **install-time hard checks** when they are the only carrier.
2. When both are present, **`engines.dsh` wins**; peer is only a fallback when engines is absent.
3. Therefore **`faf2151`'s “peer-first” is wrong** for this host. The accurate C4 wording is: *declare one compatible range; `engines.dsh` takes precedence, peer is fallback.*
4. C4 code/tests/docs must be corrected; do not ship peer-first.
5. The 30-entry results were collected before this C4 change; C4 only affects warning/pass counts, not the 7 C1/C2/C6 fails. Re-run with the corrected validator before quoting warning counts.

## B5 / B6

- **B5 client is now pass**: host app HTML contains the client manifest URL; GET returns 200 and the fixture's `client.js`. This upgrades client from “installable” to “registered and served”.
- **B6 prompt prefix remains not-run**: no `--dump-config`/`--dump-config-schema`/headless/preset/agent/prompt export path; a model call would be required, and the pilot does not use model credentials.

## Limits

- Local tarball path only; registry path not repeated.
- One host version; wide/invalid ranges not exhaustively tested.
- No independent reviewer / hold-out.

## Next

1. Fix C4 in `entry-validate`: engines-first, peer fallback; both present → engines decides; peer conflict is at most a warning (ignored by host).
2. Add fixtures for peer-only / engines-only / both (two directions); run the full checker tests.
3. Update C4 README/checklist to the engines-first wording.
4. B6: keep not-run; do not spend a model call on it unless the user explicitly asks.
5. Re-run 30 only after the C4 fix, and report warning counts separately from the 7 static fails.
