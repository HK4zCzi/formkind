# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and releases use semantic versioning.

## [Unreleased]

## [0.3.0] - 2026-08-13

### Added

- Explicit opt-in `agent` command for assessment, remediation planning, and pull-request review.
- Parallel category specialists grounded in deterministic FormKind findings and stable fingerprints.
- OpenAI Responses API provider with strict structured output, bounded excerpts, secret redaction, response storage disabled, and configurable models.
- Fully offline deterministic provider implementing the same public `AgentProvider` contract.
- Markdown and JSON agent-plan reports with workstreams, acceptance criteria, market checks, risks, next actions, and PR drafts.
- Manual, read-only GitHub Actions workflow that uploads a remediation plan artifact.
- AI agent architecture, privacy model, provider API, evaluation roadmap, and Codex for Open Source usage documentation.

## [0.2.0] - 2026-08-13

### Added

- 18 new rules covering identity, addresses, contact details, RTL content, timezones, translation, decimals, labels, and country-specific assumptions.
- Static source support for JSX, TSX, Vue, and Svelte alongside HTML and URLs.
- Global, strict, commerce, and public-sector policy profiles.
- Baseline creation and regression-only scanning for established projects.
- `init`, `rules`, `scan`, and `baseline` CLI commands.
- Finding categories and stable fingerprints in JSON and SARIF.

## [0.1.0] - 2026-08-13

### Added

- Nine rules for common international form barriers.
- Local file, recursive directory, and HTTP(S) inputs with size and time limits.
- Pretty, JSON, Markdown, and SARIF reports.
- CLI configuration, severity overrides, ignore lists, and CI failure thresholds.
- Reusable GitHub Action, security scanning, contributor documentation, and maintainer governance.

[Unreleased]: https://github.com/khanhcamap2020-sudo/formkind/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/khanhcamap2020-sudo/formkind/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/khanhcamap2020-sudo/formkind/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/khanhcamap2020-sudo/formkind/releases/tag/v0.1.0
