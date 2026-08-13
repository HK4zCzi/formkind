# Architecture

FormKind separates input, parsing, rules, and reporting so the project can grow beyond static HTML without changing its public result model.

```text
file / directory / URL
          |
          v
   bounded input loader
          |
          v
 parse5 document + locations
          |
          v
 deterministic rule engine <--- config and locale profile
          |
          v
 normalized AuditResult
    |       |       |       |
 pretty   JSON   Markdown  SARIF
```

## Current modules

- `input.ts` recursively discovers HTML, skips dependency/build directories, and bounds remote fetch time and bytes.
- `analyzer.ts` builds shared element and label context, invokes enabled rules, normalizes locations, and calculates a score.
- `rules.ts` contains small deterministic checks with stable IDs and remediation guidance.
- `reporters.ts` converts one result model into human and machine formats.
- `cli.ts` owns arguments, exit thresholds, configuration, and output files.

## Expansion boundaries

Framework support should add adapters that emit the same element/location abstraction rather than placing Vue, JSX, Svelte, or browser logic inside rules. Browser mode should be a separate optional package because executing pages has a different trust and dependency model. Locale profiles may suppress irrelevant findings only when a product explicitly declares its supported markets.

Editor plugins, pre-commit hooks, CI systems, dashboards, and hosted documentation should consume JSON or SARIF instead of duplicating rule logic. This keeps the engine useful as the ecosystem grows.

## Security model

HTML and repositories are untrusted inputs. The core parser does not execute scripts. URL loading has a timeout, response-type check, and byte limit; future browser mode must add network isolation and explicit authorization. Reports must escape content when rendered into richer formats. Maintainer AI workflows operate separately from user audits and remain advisory.
