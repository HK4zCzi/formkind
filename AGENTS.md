# Agent guide

FormKind is a deterministic global-readiness toolkit for form source and CI policy. Preserve user privacy and avoid rules that infer sensitive traits.

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
- Do not add AI calls to the end-user linter. Codex is limited to optional maintainer workflows with human review.
- Never weaken URL time/size limits, CI permissions, or untrusted-input handling without a documented security review.
