import type { Finding, RuleCategory, Severity } from "../types.js";
import { excerptsForFindings } from "./privacy.js";
import type { AgentPlan, RunAgentOptions } from "./types.js";

const severityRank: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

function selectFindings(findings: Finding[], maxFindings: number): Finding[] {
  return [...findings]
    .sort(
      (left, right) =>
        severityRank[left.severity] - severityRank[right.severity] ||
        left.category.localeCompare(right.category) ||
        left.file.localeCompare(right.file) ||
        left.location.line - right.location.line,
    )
    .slice(0, maxFindings);
}

function groupFindings(findings: Finding[]): Array<[RuleCategory, Finding[]]> {
  const grouped = new Map<RuleCategory, Finding[]>();
  for (const finding of findings) {
    const active = grouped.get(finding.category) ?? [];
    active.push(finding);
    grouped.set(finding.category, active);
  }
  return [...grouped.entries()].sort(
    (left, right) =>
      Math.min(...left[1].map((finding) => severityRank[finding.severity])) -
        Math.min(...right[1].map((finding) => severityRank[finding.severity])) ||
      right[1].length - left[1].length,
  );
}

export async function runRemediationAgent(options: RunAgentOptions): Promise<AgentPlan> {
  const goal = options.goal ?? "plan";
  const markets = options.markets?.length ? options.markets : ["global"];
  const maxFindings = options.maxFindings ?? 40;
  const maxSpecialists = options.maxSpecialists ?? 5;
  if (!Number.isSafeInteger(maxFindings) || maxFindings < 1) throw new Error("maxFindings must be a positive integer.");
  if (!Number.isSafeInteger(maxSpecialists) || maxSpecialists < 1) throw new Error("maxSpecialists must be a positive integer.");

  const selected = selectFindings(options.audit.findings, maxFindings);
  if (selected.length === 0) {
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      provider: options.provider.name,
      model: options.provider.model,
      goal,
      auditScore: options.audit.score,
      analyzedFindings: 0,
      summary: "No FormKind findings require remediation.",
      strategy: "Keep the deterministic scan in CI and monitor regressions.",
      workstreams: [],
      risks: [],
      nextActions: ["Keep FormKind enabled in pull-request checks."],
      pullRequestBody: "## FormKind review\n\nNo global-readiness findings were detected.",
      specialistReports: [],
      requiresHumanReview: true,
    };
  }

  const groups = groupFindings(selected).slice(0, maxSpecialists);
  const reports = await Promise.all(
    groups.map(([category, findings]) =>
      options.provider.analyzeSpecialist({
        goal,
        markets,
        category,
        findings,
        excerpts: excerptsForFindings(options.sources, findings),
      }),
    ),
  );
  const synthesis = await options.provider.synthesize({
    goal,
    markets,
    audit: { ...options.audit, findings: selected },
    reports,
  });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    provider: options.provider.name,
    model: options.provider.model,
    goal,
    auditScore: options.audit.score,
    analyzedFindings: selected.length,
    ...synthesis,
    specialistReports: reports,
    requiresHumanReview: true,
  };
}
