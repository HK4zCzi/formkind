import { describe, expect, it } from "vitest";
import { analyzeHtml } from "../src/analyzer.js";
import { withoutBaseline } from "../src/baseline.js";

describe("baseline filtering", () => {
  it("keeps only findings not present in the baseline", () => {
    const result = analyzeHtml("<html><input name='postal' type='number'></html>", {
      file: "a.html",
    });
    const known = result.findings.find((finding) => finding.ruleId === "FK001");
    expect(known).toBeDefined();

    const filtered = withoutBaseline(result, {
      version: 1,
      generatedAt: new Date(0).toISOString(),
      fingerprints: [known?.fingerprint ?? ""],
    });

    expect(filtered.findings.some((finding) => finding.ruleId === "FK001")).toBe(false);
    expect(filtered.findings.some((finding) => finding.ruleId === "FK010")).toBe(true);
    expect(filtered.score).toBeGreaterThan(result.score);
  });
});
