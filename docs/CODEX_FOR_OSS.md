# Codex for Open Source readiness

This document keeps the application honest and evidence-based. It is not an endorsement by OpenAI and does not mean FormKind has been accepted.

## What exists now

- A public, Apache-2.0 repository with an identified core maintainer and write access.
- A practical ecosystem purpose: preventing international-user exclusion in web forms.
- A project-scale toolkit: 27 rules, five source formats, four policy profiles, baselines, SARIF, a JavaScript API, and reusable CI integration.
- CI, tests, dependency updates, CodeQL, private vulnerability reporting, release notes, contribution guidance, and governance.
- An optional, maintainer-triggered Codex review workflow with read-only repository access and human approval.

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

> API credits would power maintainer-only Codex workflows for pull-request review, issue deduplication and triage, release-note preparation, and security-focused regression review. Runs would use least-privilege GitHub permissions, sanitized inputs, and human approval. Credits would support FormKind's public OSS maintenance only, not an end-user paid feature or unauthorized repository scanning.

**Anything else (max 500 characters)**

> FormKind is privacy-friendly by design: deterministic audits run locally and audited HTML is not sent to an AI service. The project documents governance, security response, contribution standards, and an adoption roadmap. Codex assistance is advisory; a human maintainer controls every merge and release.

The application also requires the maintainer's ChatGPT-linked email and OpenAI organization ID; these should never be committed to the repository.
