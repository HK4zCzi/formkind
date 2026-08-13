# Security policy

## Supported versions

Until 1.0, only the latest minor release receives security fixes.

## Reporting a vulnerability

Please use **Security → Report a vulnerability** in the GitHub repository to open a private security advisory. Do not include exploit details in a public issue.

Include the affected version, impact, reproduction steps, and any suggested mitigation. The maintainer aims to acknowledge a report within three business days, provide an initial assessment within seven, and coordinate a fix and disclosure timeline with the reporter.

FormKind parses untrusted HTML and can fetch user-supplied URLs. Security-sensitive areas include parser behavior, resource exhaustion, unexpected network access, path handling, report injection, and CI workflow permissions.

## Safe use

Only audit pages and repositories you own or are authorized to review. Do not pass secrets in URLs or HTML fixtures. FormKind does not send audited source to an AI service.
