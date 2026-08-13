# Adoption guide

FormKind supports both greenfield products and large applications with existing internationalization debt.

## Choose a starting profile

- Use `global` when evaluating the tool or adding it to a mixed repository.
- Use `commerce` for checkout, billing, shipping, account payout, and marketplace flows.
- Use `public-sector` when a form collects legal identity or determines access to civic, education, health, or benefit services.
- Use `strict` after a team has owners and remediation targets for global readiness.

Start with `--fail-on never` to collect evidence without blocking delivery.

## Inventory

```bash
formkind scan ./src --profile global --format json --output formkind-inventory.json --fail-on never
formkind scan ./src --profile global --format sarif --output formkind.sarif --fail-on never
```

Group findings by category and assign them to product owners. Errors generally indicate direct rejection or data corruption risk; warnings are design assumptions requiring context; info findings improve interoperability and accessibility.

## Freeze regressions

Large teams should not wait for a perfect backlog before protecting new code:

```bash
formkind baseline ./src --profile global --output .formkind-baseline.json
formkind scan ./src --profile global --baseline .formkind-baseline.json --fail-on error
```

Commit the baseline. A pull request fails only when it introduces an error with a fingerprint absent from that file. Regenerate the baseline only during an intentional review; do not update it automatically in CI.

## Tighten policy

After error findings are controlled:

1. Change `--fail-on error` to `--fail-on warning` for the most important form directories.
2. Move relevant products from `global` to `commerce`, `public-sector`, or `strict`.
3. Override individual severities with a reason in the configuration review.
4. Remove fingerprints as legacy findings are fixed.
5. Track counts and categories from JSON or SARIF without uploading audited form source.

## Monorepos

Keep one central policy and separate baselines when products have different owners or release cadences:

```text
.formkindrc.json
apps/checkout/.formkind-baseline.json
apps/support/.formkind-baseline.json
apps/admin/.formkind-baseline.json
```

Run FormKind only for changed packages when CI provides a trusted list of changed paths. Do not construct shell commands directly from untrusted pull-request text.

## Exceptions

An exception should record the rule, product scope, supported countries/locales, owner, reason, and review date. Prefer a scoped config or baseline entry over disabling a rule globally. Country-limited products should state availability clearly to users rather than silently presenting a short selector or domestic validation rule.
