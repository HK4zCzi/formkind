# FormKind

[![CI](https://github.com/HK4zCzi/formkind/actions/workflows/ci.yml/badge.svg)](https://github.com/HK4zCzi/formkind/actions/workflows/ci.yml)
[![CodeQL](https://github.com/HK4zCzi/formkind/actions/workflows/codeql.yml/badge.svg)](https://github.com/HK4zCzi/formkind/actions/workflows/codeql.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

**Make web forms work for every name, address, phone number, and locale.**

FormKind is a fast, privacy-friendly CLI and GitHub Action that finds assumptions which block international users. It audits HTML locally—no source code or form data is uploaded.

```text
x signup.html:8:7 ERROR FK002 Personal names accept Unicode letters
! signup.html:14:7 WARNING FK006 Postal labels are not country-specific

FormKind score: 78/100 | 1 file(s) | 1 error(s), 1 warning(s), 0 info
```

## Why FormKind?

A form can meet its business requirements and still reject real people: `Łukasz`, `Nguyễn`, or `李` may fail an ASCII-only name rule; `+44 20…` may not fit a domestic phone mask; and “State” or “ZIP code” may be meaningless outside one country. These bugs are easy to ship and hard for a local team to notice.

FormKind turns those assumptions into reviewable, line-level findings before users encounter them.

## Quick start

Run from a checkout:

```bash
npm install
npm run build
node dist/cli.js ./public
```

After the first npm release, projects will be able to install the CLI with `npm install --save-dev formkind` and run `npx formkind ./public`.

Audit a local file, a whole directory, or a public page:

```bash
formkind signup.html
formkind ./public --fail-on warning
formkind https://example.com/register --format markdown
formkind ./public --format sarif --output formkind.sarif
```

## GitHub Action

Pin a release tag in your workflow:

```yaml
name: International form audit
on: [pull_request]

permissions:
  contents: read

jobs:
  formkind:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: HK4zCzi/formkind@v0.1.0
        with:
          path: ./public
          fail-on: error
```

The repository also includes a SARIF example in [the CI workflow](.github/workflows/ci.yml), so findings can be uploaded to GitHub code scanning.

## Rules

| Rule | Default | Checks |
| --- | --- | --- |
| `FK001` | warning | The document declares a language. |
| `FK002` | error | Personal-name patterns do not restrict input to ASCII. |
| `FK003` | warning | Name fields allow at least 50 characters. |
| `FK004` | error | Telephone fields have room for an international number. |
| `FK005` | error | Telephone patterns allow a leading country code. |
| `FK006` | warning | Postal labels do not assume “ZIP code” for every country. |
| `FK007` | warning | Date input does not show an ambiguous locale-specific placeholder. |
| `FK008` | info | Contact fields provide standard autocomplete tokens. |
| `FK009` | warning | A required state/province/region field has country context. |

Rules are intentionally conservative and deterministic. FormKind never guesses a user's nationality or validates personal data.

## Configuration

Create `.formkindrc.json` in the directory where the command runs:

```json
{
  "ignore": ["FK008"],
  "severity": {
    "FK003": "error",
    "FK009": "off"
  }
}
```

Use `--config path/to/config.json` for a different file, or repeat `--ignore FK001` for a one-off exception. Supported severities are `error`, `warning`, `info`, and `off`.

## Output formats

- `pretty` for people in a terminal.
- `json` for scripts and dashboards.
- `markdown` for pull request comments.
- `sarif` for GitHub code scanning and compatible tools.

## Scope and limitations

Version 0.1 audits static `.html` and `.htm` files plus rendered HTML fetched from HTTP(S). It does not execute JavaScript, inspect backend validation, or certify legal/accessibility compliance. Treat findings as focused engineering feedback, not as a substitute for testing with people from the locales you support.

See the [roadmap](ROADMAP.md) for framework templates, configurable locale profiles, and browser-based audits.

The [architecture guide](docs/ARCHITECTURE.md) describes how parser adapters, locale profiles, browser audits, editor integrations, and CI consumers can grow around one stable result model.

## Community

Bug reports and new rule proposals are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), review the [governance model](GOVERNANCE.md), and report vulnerabilities through [GitHub's private security advisory flow](SECURITY.md).

FormKind is licensed under [Apache-2.0](LICENSE).
