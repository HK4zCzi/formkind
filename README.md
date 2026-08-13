# FormKind

[![CI](https://github.com/khanhcamap2020-sudo/formkind/actions/workflows/ci.yml/badge.svg)](https://github.com/khanhcamap2020-sudo/formkind/actions/workflows/ci.yml)
[![CodeQL](https://github.com/khanhcamap2020-sudo/formkind/actions/workflows/codeql.yml/badge.svg)](https://github.com/khanhcamap2020-sudo/formkind/actions/workflows/codeql.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

**Global-readiness tooling for forms, from source code to CI policy.**

FormKind finds product assumptions that reject or confuse international users: ASCII-only names, domestic phone masks, five-digit postal codes, forced states, binary identity fields, ambiguous dates, missing timezones, non-decimal measurements, untranslated pages, and more.

It runs locally and deterministically. Source code and form data are never sent to an AI service.

## What it covers

FormKind is more than an HTML linter:

- **27 rules in 7 domains:** document, identity, address, contact, date/time, localization, and accessibility.
- **Five source formats:** HTML, JSX, TSX, Vue, and Svelte, plus public rendered pages over HTTP(S).
- **Four policy profiles:** `global`, `strict`, `commerce`, and `public-sector`.
- **Adoption for legacy apps:** baseline existing findings, then block only new regressions.
- **Four report formats:** terminal, JSON, Markdown, and SARIF for GitHub code scanning.
- **Three integration surfaces:** CLI, JavaScript API, and reusable GitHub Action.
- **Maintainer automation:** optional read-only Codex review, Dependabot, CodeQL, release workflow, and human approval.

```text
x src/Checkout.tsx:18:7 ERROR FK010 Postal codes use text fields
! src/Checkout.tsx:27:7 WARNING FK020 Local date-time fields provide timezone context

FormKind score: 78/100 | 1 file(s) | 1 error(s), 1 warning(s), 0 info
```

## Quick start

From a checkout:

```bash
npm install
npm run build
node dist/cli.js scan ./src --profile commerce
```

After npm publication, the equivalent command will be:

```bash
npx formkind scan ./src --profile commerce
```

The old concise form remains valid: `formkind ./public`.

## Commands

### Scan a project

```bash
formkind scan ./src
formkind scan ./src --profile strict --fail-on warning
formkind scan https://example.com/register --format markdown
formkind scan ./app --format sarif --output formkind.sarif
```

### Adopt it without fixing every legacy finding

```bash
# Capture today's known debt once.
formkind baseline ./legacy-app --output .formkind-baseline.json

# CI now reports and blocks only findings introduced after the baseline.
formkind scan ./legacy-app --baseline .formkind-baseline.json
```

### Initialize policy and inspect rules

```bash
formkind init --profile public-sector
formkind rules
formkind rules --format markdown --output RULES.md
```

## Policy profiles

| Profile | Designed for |
| --- | --- |
| `global` | Conservative defaults suitable for most teams. |
| `strict` | Products with explicit international quality gates. |
| `commerce` | Checkout, billing, shipping, delivery, and marketplace forms. |
| `public-sector` | Identity-sensitive government, education, health, and civic services. |

Profiles change severity, not rule semantics. Teams can override any rule in `.formkindrc.json`:

```json
{
  "profile": "commerce",
  "exclude": ["generated/", "vendor/"],
  "ignore": ["FK008"],
  "severity": {
    "FK003": "error",
    "FK016": "off"
  }
}
```

## Rule families

| Family | Examples |
| --- | --- |
| Document | Missing/invalid language tags, RTL direction, page-wide translation lockout. |
| Identity | Unicode names, mononyms, required middle names/titles, forced binary gender. |
| Address | Postal code type/pattern, required region/address-line2, short country lists. |
| Contact | International telephone length/prefix, phone/email semantics, domestic examples. |
| Date and time | Ambiguous dates and timezone-free local datetimes. |
| Localization | Decimal quantities and locale-sensitive input assumptions. |
| Accessibility | Persistent labels and standard autocomplete tokens. |

Run `formkind rules --format markdown` for the complete live catalog. Rules are intentionally explainable and never infer a user's nationality, ethnicity, or gender.

## GitHub Action

```yaml
name: Global readiness
on: [pull_request]

permissions:
  contents: read

jobs:
  formkind:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: khanhcamap2020-sudo/formkind@v0.2.0
        with:
          path: ./src
          profile: commerce
          baseline: .formkind-baseline.json
          format: sarif
          output: formkind.sarif
          fail-on: error
```

The output can be uploaded to GitHub code scanning, consumed by another CI system, or posted as a pull-request comment.

## JavaScript API

```js
import { analyzeHtml, report } from "formkind";

const result = analyzeHtml(source, {
  file: "Checkout.tsx",
  config: { profile: "commerce" },
});

console.log(report(result, "json"));
```

## Architecture and growth

The normalized result model separates source adapters, policy, rule evaluation, baselines, and reporters. See [Architecture](docs/ARCHITECTURE.md), the [project-scale adoption guide](docs/ADOPTION.md), and the [Roadmap](ROADMAP.md).

The next major surfaces are a safe browser runner for client-rendered forms, framework-native AST adapters, autofix for low-risk metadata, a VS Code extension, reusable country/locale data checks, and a plugin SDK for community rule packs.

## Limitations

Source adapters in v0.2 perform static analysis and do not execute JavaScript. Dynamic component properties may require the future browser runner. FormKind is engineering guidance, not legal certification, and should complement testing with people in the markets a product supports.

## Community

Start with [CONTRIBUTING.md](CONTRIBUTING.md), review [GOVERNANCE.md](GOVERNANCE.md), and report vulnerabilities through the private process in [SECURITY.md](SECURITY.md). FormKind is licensed under [Apache-2.0](LICENSE).
