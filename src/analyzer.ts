import { type DefaultTreeAdapterMap, parse } from "parse5";
import { applyProfile } from "./profiles.js";
import { getAttribute, type Rule, rules } from "./rules.js";
import type { AnalyzeOptions, AuditResult, Finding, Severity } from "./types.js";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];

function collectElements(node: Node, output: Element[] = []): Element[] {
  if ("tagName" in node) output.push(node);
  if ("childNodes" in node) {
    for (const child of node.childNodes) collectElements(child, output);
  }
  return output;
}

function textContent(node: Node): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if (!("childNodes" in node)) return "";
  return node.childNodes.map(textContent).join(" ").replace(/\s+/g, " ").trim();
}

function labelsByControl(elements: Element[]): Map<string, string> {
  const labels = new Map<string, string>();
  for (const label of elements.filter((element) => element.tagName === "label")) {
    const target = getAttribute(label, "for");
    if (target) labels.set(target, textContent(label));
  }
  return labels;
}

function locationOf(element: Element): { line: number; column: number } {
  const location = element.sourceCodeLocation;
  return {
    line: location?.startLine ?? 1,
    column: location?.startCol ?? 1,
  };
}

function calculateScore(findings: Finding[]): number {
  const cost: Record<Severity, number> = { error: 15, warning: 7, info: 2 };
  return Math.max(0, 100 - findings.reduce((total, finding) => total + cost[finding.severity], 0));
}

function configuredSeverity(rule: Rule, options: AnalyzeOptions): Severity | "off" {
  return applyProfile(options.config ?? {}).severity?.[rule.id] ?? rule.severity;
}

function fingerprint(ruleId: string, file: string, element: Element, message: string): string {
  const attributes = [...element.attrs]
    .filter((attribute) => attribute.name !== "value")
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((attribute) => `${attribute.name}=${attribute.value}`)
    .join(";");
  const fallback = attributes || `line=${locationOf(element).line}`;
  const value = `${ruleId}|${file.replaceAll("\\", "/").replace(/^\.\//, "")}|${element.tagName}|${fallback}|${message}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fk-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function analyzeHtml(html: string, options: AnalyzeOptions = {}): AuditResult {
  const file = options.file ?? "<inline>";
  const document = parse(html, { sourceCodeLocationInfo: true });
  const elements = collectElements(document);
  const labels = labelsByControl(elements);
  const ignored = new Set(options.config?.ignore ?? []);
  const findings: Finding[] = [];

  for (const rule of rules) {
    const severity = configuredSeverity(rule, options);
    if (ignored.has(rule.id) || severity === "off") continue;
    const results = rule.check({
      file,
      elements,
      labels,
      finding: (activeRule, element, message) => {
        const location = locationOf(element);
        const finalMessage = message ?? activeRule.description;
        return {
          ruleId: activeRule.id,
          severity,
          message: finalMessage,
          help: activeRule.help,
          file,
          location,
          fingerprint: fingerprint(activeRule.id, file, element, finalMessage),
          category: activeRule.category,
        };
      },
    });
    findings.push(...results);
  }

  findings.sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      left.location.line - right.location.line ||
      left.location.column - right.location.column ||
      left.ruleId.localeCompare(right.ruleId),
  );

  const summary: Record<Severity, number> = { error: 0, warning: 0, info: 0 };
  for (const finding of findings) summary[finding.severity] += 1;

  return {
    files: [file],
    findings,
    score: calculateScore(findings),
    summary,
  };
}

export function combineResults(results: AuditResult[]): AuditResult {
  const findings = results.flatMap((result) => result.findings);
  const summary: Record<Severity, number> = { error: 0, warning: 0, info: 0 };
  for (const finding of findings) summary[finding.severity] += 1;
  return {
    files: results.flatMap((result) => result.files),
    findings,
    score: calculateScore(findings),
    summary,
  };
}
