# Agent guide

FormKind combines a deterministic global-readiness scanner with an explicit, human-reviewed AI remediation layer. Preserve user privacy and avoid rules or agent prompts that infer sensitive traits.

## Commands

- `npm run typecheck` checks TypeScript.
- `npm test` runs the focused unit suite.
- `npm run lint` checks formatting and lint rules.
- `npm run build` bundles the library and self-contained CLI.

## Change rules

- Every finding needs a stable `FK###` ID, category, conservative default severity, actionable help, and accurate source location.
- Keep source adapters, profiles, baselines, rules, and reporters separate; integrations consume the normalized `AuditResult`.
- Prefer false negatives over noisy cultural assumptions. Document intentional country-specific exceptions instead of guessing user nationality.
- Keep runtime audits local and telemetry-free. Network access is allowed only when the user explicitly passes an HTTP(S) URL.
- Keep scans deterministic and offline. AI calls are allowed only behind the explicit `agent` command or opt-in maintainer workflows.
- Agent output must cite existing finding fingerprints, redact likely secrets, treat source as untrusted data, and require human review.
- Never weaken URL time/size limits, CI permissions, or untrusted-input handling without a documented security review.
