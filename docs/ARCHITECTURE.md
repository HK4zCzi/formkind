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
                  |
                  v (explicit opt-in)
       privacy filter + finding budget
                  |
        parallel domain specialists
                  |
          remediation planner
             /          \
        Markdown        JSON
```

## Layers

- **Discovery:** recursively finds supported sources while excluding dependency and build directories.
- **Adapters:** preserve lines while converting static framework templates into markup the common engine understands.
- **Rule context:** builds element, attribute, label, text, and source-location indexes once per file.
- **Policy profiles:** map a product context to severity without forking rule behavior.
- **Baselines:** store stable finding fingerprints so mature projects can prevent regressions while paying down debt.
- **Reporters:** expose one result model to terminals, scripts, pull requests, and code-scanning systems.
- **Agent boundary:** selects verified findings, redacts bounded excerpts, coordinates category specialists, and synthesizes typed plans.
- **Integrations:** CLI, JavaScript API, composite GitHub Action, manual agent planning, and maintainer-only Codex review.

## Scale boundaries

Framework-native AST adapters should implement the common element/location contract rather than embed parser logic in rules. A future browser package will remain optional because executing web applications has a substantially different dependency and security model. Community rule packs will run through a versioned plugin API and declare required capabilities.

Editor extensions, pre-commit hooks, dashboards, and CI services should consume JSON or SARIF instead of duplicating evaluation logic. Organization policy packages should compose profiles and overrides without accessing audited source.

## Agent contracts

`AgentProvider` separates orchestration from model transport. The OpenAI implementation uses the Responses API with strict structured output. The offline implementation produces the same `AgentPlan` contract without network access. Agent plans cite fingerprints rather than free-form source locations, so downstream tools can join them back to JSON or SARIF results.

The orchestrator intentionally limits autonomy: specialists run independently by rule category, the planner receives only their typed reports, and no provider receives tools that can write files, call GitHub, execute code, or browse the web.

## Security model

Repositories, HTML, framework source, URLs, and report consumers are untrusted. Static adapters never execute application code. URL loading enforces protocol, content type, timeout, and byte limits. The AI command is explicit opt-in, redacts common secret patterns, sends bounded excerpts, disables response storage, and remains advisory. Future browser runs must add explicit authorization, network isolation, navigation limits, and evidence redaction. Maintainer workflows are least-privilege and manually triggered.
