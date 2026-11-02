# HOLD — J3 host report draft (not ready to send)

> **Do not send this draft.** The J3-CLEAN bundle case used top-level `maxTokens` / `budgetLog`, but the actual plugin schema nests them under `autoContext`. Those were unknown keys, so the silent result is expected and does **not** prove a validation bypass.
>
> Rerun with `chunkChars: "not-a-number"` and `autoContext.maxTokens` / `autoContext.budgetLog` first. See [`reviews/2026-11-03-j3-schema-correction.md`](../reviews/2026-11-03-j3-schema-correction.md).

## After the corrected test

- If the actual fields are silent: use the matched control + corrected fields, then send privately.
- If they fail with field paths: no J3 bug; close the host question.
- Do not name the plugin or host logs; do not open a public issue.

## Draft question (use only after the corrected test)

Hello — we found one reproducible case while testing a plugin bundle in an isolated profile.

- Host: `dsh 0.2.1-rc.5`, `cordis 4.0.5`, Linux x64.
- Matched control: built-in `webserver` with a valid host and only `port: "not-a-number"` fails with `$.port`.
- Bundle case: with the actual schema fields, `chunkChars: "not-a-number"` and `autoContext.budgetLog: "loud"` are accepted without `ValidationError`/warning/field path.
- The same schema parsed directly with `@deepseek-ai/schemastery` throws with the corresponding paths.
- Unknown keys are separate (Schemastery preserves them).

Question: should bundle-inserted entries use the same config resolution/validation as built-in entries? If intentional, we will document a host limitation and not ask plugins to compensate.

We are not asking for a public issue or a security label; this is a private reproduction. Happy to share the minimal profile and logs privately.

## Attachments to prepare

- `J3-CORRECTED.md` with the actual-field test.
- Redacted `cordis.patch.yml` and boot log.
- Host/Cordis/OS versions and exact commands.
