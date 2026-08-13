# AI remediation agent

FormKind's AI layer turns deterministic global-readiness findings into a reviewable engineering program. It does not replace the rule engine, invent findings, edit files, merge pull requests, or make product policy decisions.

## Why an agent belongs here

A linter can identify a five-digit postal-code constraint, a timezone-free appointment input, or a name field that rejects Unicode. Real remediation still spans component code, validation schemas, backend contracts, analytics, content, QA, and rollout. The agent connects those tasks while keeping each recommendation anchored to a stable FormKind fingerprint.

```text
source files
    |
    v
deterministic scan ──> AuditResult + stable fingerprints
    |
    v
finding budget + redacted excerpts
    |
    +----> identity specialist -----+
    +----> address specialist ------+
    +----> date/time specialist ----+--> remediation planner
    +----> accessibility specialist +          |
                                                  v
                                  Markdown / JSON / PR draft
```

## Agent stages

1. **Grounding:** the normal scanner produces authoritative findings. The model is instructed not to add findings.
2. **Budgeting:** errors and warnings are prioritized, then capped with `--max-findings` and `--max-specialists`.
3. **Privacy filter:** only short line-numbered excerpts around findings are selected. Common tokens, secrets, authorization values, and form values are redacted.
4. **Parallel specialists:** category-specific agents explain impact, remediation, patch hints, acceptance criteria, market checks, and blockers.
5. **Synthesis:** a planner converts specialist reports into prioritized workstreams, risks, next actions, and a pull-request description.
6. **Human gate:** all output is advisory. FormKind does not apply patches or write to GitHub.

## Commands

```bash
formkind agent ./src --offline

OPENAI_API_KEY=... formkind agent ./src \
  --goal review \
  --profile public-sector \
  --markets en-GB,ar-EG,hi-IN,ja-JP \
  --max-findings 60 \
  --max-specialists 7 \
  --model gpt-5.6-terra \
  --format json \
  --output formkind-agent.json
```

| Option | Purpose |
| --- | --- |
| `--goal assess` | Explain impact and validation needs. |
| `--goal plan` | Produce prioritized implementation workstreams. |
| `--goal review` | Emphasize reviewer concerns and a PR-ready summary. |
| `--markets` | Add explicit locale validation targets without inferring user identity. |
| `--offline` | Use a deterministic provider; no API key or network call. |
| `--model` | Select the Responses API model. |
| `--api-base` | Point at a compatible Responses endpoint. |

## Provider API

The public `AgentProvider` interface has two bounded operations:

- `analyzeSpecialist(request)` receives one rule category, its findings, markets, and redacted excerpts.
- `synthesize(request)` receives the normalized audit and specialist reports.

Both return typed objects. The OpenAI provider requests strict JSON Schema output through the Responses API, uses `store: false`, caps output tokens, and applies a two-minute timeout. The offline provider implements the same contract, which makes local development, CI fallback, and provider testing possible without credentials.

```ts
import {
  OpenAIResponsesProvider,
  runRemediationAgent,
} from "formkind";

const plan = await runRemediationAgent({
  audit,
  sources,
  provider: new OpenAIResponsesProvider({ model: "gpt-5.6-terra" }),
  goal: "plan",
  markets: ["en-US", "ar-SA", "ja-JP"],
});
```

Organizations can implement the interface for a self-hosted model, another provider, or an internal approval gateway.

## Security and privacy

- `scan`, `baseline`, `rules`, and `init` never call an AI service.
- The agent runs only when the user explicitly invokes `formkind agent` or a maintainer manually starts its workflow.
- The API key is read from the environment and is never written to reports.
- Source is untrusted data. Prompts tell specialists to ignore instructions embedded in source excerpts.
- Excerpts are bounded and redacted, but users must still review what their repository contains before enabling a remote provider.
- No personal form submissions or runtime user data are collected.
- Recommendations may be wrong. Human review, product validation, accessibility testing, and market research remain required.

## Maintainer automation

The manual `agent-plan.yml` workflow builds the project, runs the agent with a repository secret, and uploads the Markdown plan as an artifact. It uses read-only repository permissions and does not comment, commit, or merge. Maintainers can combine the plan with the separate Codex PR-review workflow after reviewing the artifact.

## Evaluation roadmap

The next evaluation corpus will contain representative checkout, identity, appointment, education, and public-service forms. Each case will measure fingerprint coverage, plan completeness, unsupported claims, acceptance-criteria quality, token use, latency, and reviewer agreement. Provider or prompt changes should not ship merely because they sound better; they should improve these public fixtures.
