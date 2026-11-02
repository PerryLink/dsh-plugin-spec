# J3 schema correction — 2026-11-02

> **This supersedes the J3-CLEAN conclusion. Do not send the host report yet.**
> 非官方 · 非认证 · 无 `verified`.

## Finding

The J3-CLEAN test used `@yolk_vat-y/dsh-project-memory@0.6.8` (profile package; tarball `/tmp/dsh-pilot-2026-11-02/packs/yolk_vat-y-dsh-project-memory-0.6.8.tgz`). Its `package/src/index.js` schema is:

- top-level fields include `memoryDir` (string), `chunkChars` (number), `maxChunksPerFile` (number), `watch` (boolean), `watchInterval` (number);
- `maxTokens` (number) and `budgetLog` (`off|once|all`) are **nested under `autoContext`**, not top-level.

Source: the profile tarball above, `package/src/index.js`; the local copy `00080000/dsh-project-memory` has the same shape and can be used as a readable reference (`src/index.js:26-54`, `:102-121`).

The J3-CLEAN patches put `maxTokens` / `budgetLog` at the **top level**:

```yaml
config:
  maxTokens: "not-a-number"
  budgetLog: loud
```

Those are **unknown keys** for this plugin. Schemastery preserves unknown keys, so silent acceptance is the expected behavior — it does **not** prove that bundle entries bypass wrong-type/enum validation.

## Corrected test matrix

| case | field | expected if host validates bundle entries |
|---|---|---|
| top-level wrong type | `chunkChars: "not-a-number"` | `$.chunkChars` or warning |
| nested wrong type | `autoContext.maxTokens: "not-a-number"` | `$.autoContext.maxTokens` or warning |
| nested enum | `autoContext.budgetLog: "loud"` | `$.autoContext.budgetLog` or warning |
| unknown key | `totallyUnknownKey: true` | silent is expected (UX warning only) |
| baseline | valid fields | boot normal |

The built-in `webserver` control (`host` valid, only `port: "not-a-number"` → `$.port`) remains valid.

## What to do

1. **Do not send** `HOST-J3-BUG-REPORT-DRAFT.md` as-is.
2. Rerun with `chunkChars` and `autoContext.*` fields; every other field valid.
3. If all actual fields are silent: host validation gap is confirmed; then send a corrected report.
4. If they fail with field paths: there is **no J3 bug**; the original result was unknown-key behavior.
5. Either way, no C1–C8 change; unknown-key UX can be a separate optional warning.

## Why this matters

The built-in control is clean, but the bundle case was not matched to the actual schema. A host report based on the old case would be rejected as "those are unknown keys", and would damage credibility. The correction is a review finding, not a failure of the host.
