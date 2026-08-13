import { rules } from "./rules.js";
import type { AuditResult, Finding, Severity } from "./types.js";

export type Format = "pretty" | "json" | "markdown" | "sarif";

function icon(severity: Severity): string {
  return severity === "error" ? "x" : severity === "warning" ? "!" : "i";
}

function pretty(result: AuditResult): string {
  const lines = result.findings.map(
    (finding) =>
      `${icon(finding.severity)} ${finding.file}:${finding.location.line}:${finding.location.column} ` +
      `${finding.severity.toUpperCase()} ${finding.ruleId} ${finding.message}`,
  );
  lines.push(
    "",
    `FormKind score: ${result.score}/100 | ${result.files.length} file(s) | ` +
      `${result.summary.error} error(s), ${result.summary.warning} warning(s), ${result.summary.info} info`,
  );
  return lines.join("\n");
}

function markdown(result: AuditResult): string {
  const lines = [
    "# FormKind report",
    "",
    `**Score:** ${result.score}/100 across ${result.files.length} file(s).`,
    "",
    "| Severity | Rule | Location | Message |",
    "| --- | --- | --- | --- |",
  ];
  for (const finding of result.findings) {
    lines.push(
      `| ${finding.severity} | ${finding.ruleId} | ${finding.file}:${finding.location.line}:${finding.location.column} | ${finding.message} |`,
    );
  }
  if (result.findings.length === 0) lines.push("| - | - | - | No findings. | ");
  return `${lines.join("\n")}\n`;
}

function sarif(result: AuditResult): string {
  const levels: Record<Severity, "error" | "warning" | "note"> = {
    error: "error",
    warning: "warning",
    info: "note",
  };
  const usedRuleIds = new Set(result.findings.map((finding) => finding.ruleId));
  return JSON.stringify(
    {
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      version: "2.1.0",
      runs: [
        {
          tool: {
            driver: {
              name: "FormKind",
              informationUri: "https://github.com/HK4zCzi/formkind",
              version: "0.1.0",
              rules: rules
                .filter((rule) => usedRuleIds.has(rule.id))
                .map((rule) => ({
                  id: rule.id,
                  shortDescription: { text: rule.description },
                  help: { text: rule.help },
                })),
            },
          },
          results: result.findings.map((finding: Finding) => ({
            ruleId: finding.ruleId,
            level: levels[finding.severity],
            message: { text: `${finding.message} ${finding.help}` },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: finding.file.replaceAll("\\", "/") },
                  region: {
                    startLine: finding.location.line,
                    startColumn: finding.location.column,
                  },
                },
              },
            ],
          })),
        },
      ],
    },
    null,
    2,
  );
}

export function report(result: AuditResult, format: Format): string {
  if (format === "json") return JSON.stringify(result, null, 2);
  if (format === "markdown") return markdown(result);
  if (format === "sarif") return sarif(result);
  return pretty(result);
}
