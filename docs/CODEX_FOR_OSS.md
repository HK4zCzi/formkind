# Codex for Open Source readiness

This document keeps the application honest and evidence-based. It is not an endorsement by OpenAI and does not mean FormKind has been accepted.

## What exists now

- A public, Apache-2.0 repository with an identified core maintainer and write access.
- A practical ecosystem purpose: preventing international-user exclusion in web forms.
- A project-scale toolkit: 27 rules, five source formats, four policy profiles, baselines, SARIF, a JavaScript API, reusable CI, and an opt-in AI remediation agent.
- CI, tests, dependency updates, CodeQL, private vulnerability reporting, release notes, contribution guidance, and governance.
- Optional, maintainer-triggered Codex review and structured agent-planning workflows with read-only repository access and human approval.

## Evidence to build before applying

Record verifiable, public signals here rather than estimating them:

| Signal | Current value | Where to verify |
| --- | --- | --- |
| GitHub stars | 0 at launch | Repository Insights |
| Dependents | 0 at launch | GitHub dependency graph |
| Monthly npm downloads | Not published | npm package statistics |
| External contributors | 0 at launch | Contributors page |
| Issues/PRs triaged | 0 at launch | Closed issues and pull requests |
| Releases | 1 at v0.1 launch | Releases page |

Apply when there is meaningful usage or clear ecosystem evidence. A new repository cannot truthfully claim broad adoption or a long maintenance record.

## Draft answers

Replace bracketed fields and update metrics immediately before submitting. Every claim must be accurate.

**Maintainer role (max 500 characters)**

> I am the founder and core maintainer of FormKind. I own the roadmap and rule design, review pull requests, triage issues, maintain CI and security policy, and publish releases. I have write/admin access to the public repository and remain responsible for the quality and safety of each release.

**Why this repository qualifies (max 500 characters)**

> FormKind is global-readiness infrastructure for HTML, JSX, Vue, and Svelte forms. Its 27 rules, policy profiles, legacy baselines, SARIF and GitHub Action catch identity, address, phone, date, timezone and localization barriers. It is used by [projects/users], has [stars/downloads/dependents], and has shipped [releases] with active maintenance.

**How API credits would be used (max 500 characters)**

> API credits would power FormKind's public remediation agent and maintainer workflows: grounded PR plans, issue triage, review and release preparation. Calls use deterministic finding IDs, bounded redacted excerpts, structured outputs, least-privilege CI and human approval. Credits support OSS maintenance and evaluation, never unauthorized scanning or autonomous merges.

**Anything else (max 500 characters)**

> FormKind keeps scans deterministic and local. Its optional agent runs only by explicit command, sends bounded redacted excerpts with response storage disabled, and produces advisory plans rather than commits. The project documents governance, security response and evaluation; a human controls every merge and release.

The application also requires the maintainer's ChatGPT-linked email and OpenAI organization ID; these should never be committed to the repository.
