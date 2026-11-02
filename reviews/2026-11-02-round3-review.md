# Round 3 review — 2026-11-02

> 非独立 reviewer · 非官方 · 非认证 · 无 `verified`。Review of `ROUND3-REPORT-2026-11-02.md` / `J3-CLEAN.md`.

## What holds

- **J3 matched control is clean**: built-in `webserver` with a valid host and only `port: "not-a-number"` fails with `$.port`; the bundle entry with the same kind of schema error boots and shows no validation output. This fixes the round-2 confound.
- **J3 boot harness is now correct**: wait for the URL, then kill; no timeout-124 ambiguity.
- **J5 code-level** finds 8/8 plugins with at least one undeclared class; average 1.12 classes/plugin; still author aid, not a gate.
- **B2/B4** pass with resource/negative controls; **B6** only config assembly, prompt prefix not-run.

## What needs caution

1. **Confirm the invalid fields are in the tested plugin's schema.** `J3-CLEAN` baseline uses `memoryDir/chunkChars/maxChunksPerFile/watch/watchInterval`, while the wrong-type/enum cases use `maxTokens/budgetLog`. The direct-Schemastery control says the schema contains the latter, but the baseline should use the same schema shape. If `maxTokens/budgetLog` were unknown keys, the test would conflate unknown-key semantics with wrong-type/enum. Ask for one schema dump or add the invalid field to a baseline config that otherwise uses the same fields.
2. **Impact is not proven.** `--dump-config` prints the invalid value, but there is no plugin-side instrumentation showing the plugin read it. The host should still validate or warn; just do not claim a runtime failure.
3. **One plugin / one host / one OS.** Call it one reproducible case; do not generalize to all bundle entries.
4. **Unknown key is separate** (Schemastery preserves unknown keys); it is a UX warning, not the same bug.
5. **J5 uses 8 plugins and a code scan**, not AST; the 1.12/plugin number is descriptive, not a standard.
6. **B2/B4 are shape-compatible**, not template-executed; B6 prompt prefix and cross-version are not-run.

## Decision

- No C1–C8 change from J3. It is a host question; if the host says the behavior is intentional, record a documented host limitation.
- J5 stays author kit; B2/B4 stay fixture evidence; B6 remains partial.
- Do not send the host report until the schema-field check is done.

## Next 3

1. Confirm the tested plugin schema includes `maxTokens/budgetLog`; if not, rerun with fields that are definitely in the baseline schema.
2. Update the private host report with the matched control + the schema-field check; send privately.
3. J5 AST on 10 plugins; B6 prompt-prefix only if a non-model-render CLI exists; otherwise not-run.
