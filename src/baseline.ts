import { readFile, writeFile } from "node:fs/promises";
import type { AuditResult, BaselineFile, Severity } from "./types.js";

export async function writeBaseline(path: string, result: AuditResult): Promise<BaselineFile> {
  const baseline: BaselineFile = {
    version: 1,
    generatedAt: new Date().toISOString(),
    fingerprints: [...new Set(result.findings.map((finding) => finding.fingerprint))].sort(),
  };
  await writeFile(path, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
  return baseline;
}

export async function loadBaseline(path: string): Promise<BaselineFile> {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("FormKind baseline must be a JSON object.");
  }
  const baseline = parsed as BaselineFile;
  if (baseline.version !== 1 || !Array.isArray(baseline.fingerprints)) {
    throw new Error("Unsupported or invalid FormKind baseline.");
  }
  return baseline;
}

export function withoutBaseline(result: AuditResult, baseline: BaselineFile): AuditResult {
  const known = new Set(baseline.fingerprints);
  const findings = result.findings.filter((finding) => !known.has(finding.fingerprint));
  const summary: Record<Severity, number> = { error: 0, warning: 0, info: 0 };
  for (const finding of findings) summary[finding.severity] += 1;
  const score = Math.max(
    0,
    100 -
      findings.reduce((total, finding) => {
        const cost: Record<Severity, number> = { error: 15, warning: 7, info: 2 };
        return total + cost[finding.severity];
      }, 0),
  );
  return { ...result, findings, summary, score };
}
