import type { AgentPlan } from "./types.js";

export type AgentFormat = "json" | "markdown";

export function reportAgentPlan(plan: AgentPlan, format: AgentFormat): string {
  if (format === "json") return `${JSON.stringify(plan, null, 2)}\n`;

  const lines = [
    "# FormKind AI remediation plan",
    "",
    `> ${plan.provider} / ${plan.model} · ${plan.analyzedFindings} finding(s) · score ${plan.auditScore}/100`,
    "",
    plan.summary,
    "",
    "## Strategy",
    "",
    plan.strategy,
    "",
    "## Workstreams",
    "",
  ];
  for (const stream of plan.workstreams) {
    lines.push(`### ${stream.title} (${stream.priority})`, "", `Owner: ${stream.owner}`, "");
    lines.push(`Findings: ${stream.findingFingerprints.map((value) => `\`${value}\``).join(", ")}`, "");
    lines.push(...stream.steps.map((step) => `- ${step}`), "", "Validation:", "");
    lines.push(...stream.validation.map((item) => `- [ ] ${item}`), "");
  }
  if (plan.risks.length) lines.push("## Risks", "", ...plan.risks.map((risk) => `- ${risk}`), "");
  lines.push("## Next actions", "", ...plan.nextActions.map((action) => `- [ ] ${action}`), "");
  lines.push("## Pull request draft", "", plan.pullRequestBody, "", "---", "Human review is required before implementation or rollout.", "");
  return lines.join("\n");
}
