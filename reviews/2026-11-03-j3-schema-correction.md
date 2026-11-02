# J3 schema correction — closed, no host bug (2026-11-02)

> **Final status: no J3 bug. The host report is withdrawn.**
> 非官方 · 非认证 · 无 `verified`.

## What was wrong

The J3-CLEAN bundle test used `@yolk_vat-y/dsh-project-memory@0.6.8`, whose schema has:

- top-level: `memoryDir`, `chunkChars`, `maxChunksPerFile`, `watch`, `watchInterval`;
- nested under `autoContext`: `maxTokens`, `budgetLog`.

J3-CLEAN put `maxTokens` / `budgetLog` at the **top level**. Those were unknown keys; Schemastery preserves unknown keys, so the silent result was expected. The built-in `$.port` control was valid, but the bundle case was not matched to the actual schema.

## Corrected test (same plugin, temp profile)

| case | actual |
|---|---|
| baseline valid | boot URL appears; no error |
| `chunkChars: "not-a-number"` | `ValidationError` with **`$.chunkChars`**; entry not active; host continues |
| `autoContext.maxTokens: "not-a-number"` | `ValidationError` with **`$.autoContext.maxTokens`**; entry not active; host continues |
| `autoContext.budgetLog: "loud"` | `ValidationError` with **`$.autoContext.budgetLog`**; entry not active; host continues |
| unknown top-level key | silent; Schemastery semantics, not a bug |
| built-in `webserver` invalid `port` (host valid) | startup fails with **`$.port`** |

## Conclusion

1. **Validation exists and paths are correct**, including nested paths.
2. **Severity is sensible**: a bundle entry fails but the host keeps serving (warning + entry not active); a required built-in plugin failure stops startup.
3. **Unknown key silent** is library semantics; at most a UX warning, not the same bug.
4. **`--dump-config` does not validate**; validation happens at mount. This is worth documenting but is not a bug.
5. **Withdraw** the J3 host report; no public issue; no standard change.

## Limits

- One plugin / one host / one OS.
- Not tested: volatile fields, patch array shapes, other bundle entries.
- This closes *this* case only; it does not prove all bundle entries are validated.

## Supersedes

`J3-REPRO.md` and the J3-CLEAN "bundle not validated" conclusion are withdrawn. J3-CLEAN's built-in `$.port` control remains valid.
