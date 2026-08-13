import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { analyzeHtml, combineResults } from "../src/analyzer.js";

describe("analyzeHtml", () => {
  it("finds internationalization barriers with source locations", async () => {
    const html = await readFile(new URL("./fixtures/problematic.html", import.meta.url), "utf8");
    const result = analyzeHtml(html, { file: "problematic.html" });
    const ruleIds = new Set(result.findings.map((finding) => finding.ruleId));

    expect(ruleIds).toEqual(
      new Set(["FK001", "FK002", "FK003", "FK004", "FK005", "FK006", "FK007", "FK008", "FK009"]),
    );
    expect(result.summary.error).toBe(3);
    expect(result.summary.warning).toBe(5);
    expect(result.summary.info).toBeGreaterThan(0);
    expect(result.findings.every((finding) => finding.location.line > 0)).toBe(true);
    expect(result.score).toBeLessThan(50);
  });

  it("accepts an inclusive form", async () => {
    const html = await readFile(new URL("./fixtures/inclusive.html", import.meta.url), "utf8");
    const result = analyzeHtml(html, { file: "inclusive.html" });

    expect(result.findings).toEqual([]);
    expect(result.score).toBe(100);
  });

  it("supports ignored rules and severity overrides", () => {
    const result = analyzeHtml(
      "<html><body><input name='name' pattern='[A-Za-z]+'></body></html>",
      {
        config: {
          ignore: ["FK001"],
          severity: { FK002: "warning", FK008: "off" },
        },
      },
    );

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ ruleId: "FK002", severity: "warning" });
  });
});

describe("combineResults", () => {
  it("combines summaries and file names", () => {
    const first = analyzeHtml("<html lang='en'></html>", { file: "a.html" });
    const second = analyzeHtml("<html></html>", { file: "b.html" });
    const result = combineResults([first, second]);

    expect(result.files).toEqual(["a.html", "b.html"]);
    expect(result.summary.warning).toBe(1);
    expect(result.score).toBe(93);
  });
});
