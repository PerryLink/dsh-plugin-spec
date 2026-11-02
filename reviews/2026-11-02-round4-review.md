# Round 4 review — J5 AST / B3 / B5 (2026-11-02)

> 非独立 reviewer · 非官方 · 非认证 · 无 `verified`。Review of `J5-AST.md` and `BOOST-B3-B5.md`.

## J5 AST

- 10/10 plugins have fs / network / child_process / env / timers calls; **13 gaps, 1.30/plugin**; reads/writes are the most common missing paths.
- AST is better than the regex pass (it catches destructured `node:child_process`), but it skips `.ts/.tsx`, dynamic `require`, and string-built paths.
- Keep as **author aid**; not an ENTRY gate, no ranking.

## B5 — engines / bundle / client

| fixture | result | meaning |
|---|---|---|
| `engines.dsh: "<0.0.1"` | **install rejected** (`add` exit 1), explicit `allow-version` override, package/lock/node_modules rolled back | `engines.dsh` is **hard-enforced at install**, not display-only |
| `dsh.bundle.patch: "./missing.yml"` | **install rejected** (`ENOENT`) | C2 “patch file must exist” is host-enforced |
| `dsh.client` + `exports["./client"]` | install ok / boot ok | only declaration + boot; **client injection not independently verified** → partial |

### Conflict with C4 peer-first

The concurrent commit `faf2151` says “C4 peer-first; `engines.dsh` alone is display/compatibility”. B5 shows the host **rejects install** when `engines.dsh` is incompatible. Both may be true at different stages (install vs runtime), but the C4 wording and tests are not reconciled.

**Do not finalize C4 peer-first yet.** Run the matrix:

- peer only (compatible / incompatible)
- engines only (compatible / incompatible)
- both (agree / conflict)
- add result, boot result, field/error

If `engines.dsh` incompatible is always rejected, C4 must treat it as a hard install gate even if peer is the runtime carrier. If peer-only incompatible is also rejected, peer is hard too. If both are enforced, C4 needs a two-carrier statement, not “peer-first”.

## B3 — volatile

- External log lines did not change after rewriting the profile; no reload/restart event visible.
- **not-run**, not a pass: need an in-process Loader harness or a host-exposed reload event. Do not infer “0 restarts” from logs.

## Decision

- No C1–C8 change from J5 AST or B3.
- B5 supports C2 patch existence and shows `engines.dsh` is install-enforced; **C4 is contested** pending matrix.
- B5 `dsh.client` remains partial; B3 not-run.
- No `verified`; one host/OS.

## Next

1. C4 matrix (peer-only / engines-only / both; compatible/incompatible).
2. B3 in-process Loader; if no observation, keep not-run.
3. B5 client injection evidence; otherwise partial.
4. B6 prompt prefix; hold-out/independent reviewer.
