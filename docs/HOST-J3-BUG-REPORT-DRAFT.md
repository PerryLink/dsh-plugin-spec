# Private host report draft — bundle entry config validation

> **Do not post publicly.** Send privately to the host maintainer. No plugin names, no host logs, no internal paths. Remove this file from any public artifact.

## Subject

Config validation for bundle-inserted entries: wrong type/enum silently accepted?

## Body

Hello — we found one reproducible case while testing a plugin bundle in an isolated profile.

- Host: `dsh 0.2.1-rc.5`, `cordis 4.0.5`, Linux x64.
- Setup: temporary `DSH_HOME`; one bundle entry with a Schemastery config schema.
- Matched control: the built-in `webserver` with a valid host and only `port: "not-a-number"` fails with `$.port`.
- Bundle case: with the rest of the config valid, `maxTokens: "not-a-number"` and `budgetLog: "loud"` are accepted by `--dump-config`; boot reaches the URL with no `ValidationError`, no warning, and no field path.
- The same schema parsed directly with `@deepseek-ai/schemastery` throws with `$.maxTokens` / `$.budgetLog`.
- Unknown keys are a separate behavior: Schemastery preserves them, so we are not counting that as the same bug.

Question: should bundle-inserted entries go through the same config resolution/validation as built-in entries? If yes, could the host surface a field path (or at least a warning) for wrong type/enum? If this is intentional, we will document it as a host limitation and will not ask plugins to compensate.

We are not asking for a public issue or a security label; this is a private reproduction. Happy to share the minimal profile and logs privately.

## Attachments to prepare

- `J3-CLEAN.md` with the matched control result (built-in `$.port`, bundle silent).
- Redacted `cordis.patch.yml` and boot log.
- Host/Cordis/OS versions and exact commands.
