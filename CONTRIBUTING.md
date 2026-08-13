# Contributing to FormKind

Thank you for helping forms welcome more people.

## Before opening a change

- Search existing issues and discussions.
- For a new rule, open a rule proposal first. Include failing and inclusive source examples, expected profile behavior, false-positive risks, and at least one authoritative internationalization reference.
- Keep rules deterministic. A rule must not infer nationality, ethnicity, gender, or other sensitive traits.

## Local development

Requirements: Node.js 20 or later and npm.

```bash
npm install
npm run check
npm run build
node dist/cli.js scan test/fixtures/problematic.html --fail-on never
```

Add focused tests for behavior changes. A new rule needs at least one failing and one inclusive example. Adapter changes should cover source location and the framework syntax they introduce.

## Pull requests

Keep pull requests focused and explain user impact. CI must pass type checking, linting, tests, coverage thresholds, a package dry run, and the project's own FormKind audit. A maintainer reviews every change before merge.

By contributing, you agree that your contribution is licensed under Apache-2.0 and that you will follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Maintainer workflow

Maintainers triage issues weekly, review dependency alerts promptly, and publish releases from signed Git tags. The optional Codex workflow is manually triggered by a maintainer and provides review input; a human always makes the merge and release decision.
