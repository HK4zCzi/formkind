import { describe, expect, it } from "vitest";
import { analyzeHtml } from "../src/analyzer.js";
import { report } from "../src/reporters.js";

const result = analyzeHtml(
  "<html><body><label for='zip'>ZIP code</label><input id='zip'></body></html>",
  {
    file: "form.html",
  },
);

describe("report", () => {
  it("renders a readable terminal report", () => {
    expect(report(result, "pretty")).toContain("FormKind score:");
    expect(report(result, "pretty")).toContain("form.html:");
  });

  it("renders JSON", () => {
    expect(JSON.parse(report(result, "json"))).toMatchObject({ files: ["form.html"] });
  });

  it("renders Markdown", () => {
    const output = report(result, "markdown");
    expect(output).toContain("# FormKind report");
    expect(output).toContain("| warning | FK006 |");
  });

  it("renders SARIF 2.1.0", () => {
    const output = JSON.parse(report(result, "sarif"));
    expect(output.version).toBe("2.1.0");
    expect(output.runs[0].tool.driver.name).toBe("FormKind");
    expect(output.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri).toBe(
      "form.html",
    );
  });
});
