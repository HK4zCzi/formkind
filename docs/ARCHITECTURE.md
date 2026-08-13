# Architecture

FormKind is organized as a pipeline so every new integration reuses the same rule and policy semantics.

```text
HTML / JSX / TSX / Vue / Svelte / URL
                  |
                  v
      discovery + bounded source adapters
                  |
                  v
       normalized element/location graph
                  |
          +-------+--------+
          |                |
    policy profile      baseline
          |                |
          +-------+--------+
                  |
          27-rule engine
                  |
                  v
          normalized AuditResult
       /          |          |         \
  terminal       JSON     Markdown     SARIF
```

## Layers

- **Discovery:** recursively finds supported sources while excluding dependency and build directories.
- **Adapters:** preserve lines while converting static framework templates into markup the common engine understands.
- **Rule context:** builds element, attribute, label, text, and source-location indexes once per file.
- **Policy profiles:** map a product context to severity without forking rule behavior.
- **Baselines:** store stable finding fingerprints so mature projects can prevent regressions while paying down debt.
- **Reporters:** expose one result model to terminals, scripts, pull requests, and code-scanning systems.
- **Integrations:** CLI, JavaScript API, composite GitHub Action, and maintainer-only Codex review.

## Scale boundaries

Framework-native AST adapters should implement the common element/location contract rather than embed parser logic in rules. A future browser package will remain optional because executing web applications has a substantially different dependency and security model. Community rule packs will run through a versioned plugin API and declare required capabilities.

Editor extensions, pre-commit hooks, dashboards, and CI services should consume JSON or SARIF instead of duplicating evaluation logic. Organization policy packages should compose profiles and overrides without accessing audited source.

## Security model

Repositories, HTML, framework source, URLs, and report consumers are untrusted. Static adapters never execute application code. URL loading enforces protocol, content type, timeout, and byte limits. Future browser runs must add explicit authorization, network isolation, navigation limits, and evidence redaction. Maintainer AI workflows are separate, least-privilege, manually triggered, and advisory.
