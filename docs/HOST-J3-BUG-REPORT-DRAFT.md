# WITHDRAWN — no J3 host bug

> **Do not send.** The corrected test showed that the actual schema fields (`chunkChars`, `autoContext.maxTokens`, `autoContext.budgetLog`) all produce `ValidationError` with the correct field paths. The earlier silent result came from top-level `maxTokens` / `budgetLog`, which are unknown keys in this plugin.
>
> J3 is closed. No public issue, no host report, no standard change. See [`reviews/2026-11-03-j3-schema-correction.md`](../reviews/2026-11-03-j3-schema-correction.md).

## What to keep

- `--dump-config` does not validate; validation happens at mount.
- A bundle entry failure leaves the host serving (warning + entry not active); a required built-in failure stops startup.
- Unknown-key silence is Schemastery semantics; optional UX warning only.
