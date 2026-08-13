import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { analyzeHtml, combineResults } from "./analyzer.js";
import { loadConfig } from "./config.js";
import { loadInput } from "./input.js";
import { type Format, report } from "./reporters.js";
import type { FormKindConfig, Severity } from "./types.js";

const version = "0.1.0";
const validFormats = new Set<Format>(["pretty", "json", "markdown", "sarif"]);
const validThresholds = new Set(["error", "warning", "never"]);

function help(): string {
  return `FormKind ${version} - make web forms work for everyone

Usage:
  formkind <file|directory|url> [...] [options]

Options:
  --format <pretty|json|markdown|sarif>  Output format (default: pretty)
  --output <path>                       Write the report to a file
  --config <path>                       Config file (default: .formkindrc.json)
  --ignore <rule>                       Ignore a rule; repeatable
  --fail-on <error|warning|never>        Exit 1 at this severity (default: error)
  --max-size <bytes>                    Maximum bytes per input (default: 2000000)
  --version                             Print the version
  --help                                Show this help

Examples:
  formkind ./public
  formkind https://example.com/signup --format markdown
  formkind index.html --format sarif --output formkind.sarif`;
}

function reachesThreshold(summary: Record<Severity, number>, threshold: string): boolean {
  if (threshold === "never") return false;
  if (threshold === "warning") return summary.error > 0 || summary.warning > 0;
  return summary.error > 0;
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      format: { type: "string", default: "pretty" },
      output: { type: "string", short: "o" },
      config: { type: "string" },
      ignore: { type: "string", multiple: true },
      "fail-on": { type: "string", default: "error" },
      "max-size": { type: "string", default: "2000000" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  if (values.version) {
    console.log(version);
    return;
  }
  if (values.help || positionals.length === 0) {
    console.log(help());
    process.exitCode = positionals.length === 0 && !values.help ? 2 : 0;
    return;
  }

  const format = values.format as Format;
  if (!validFormats.has(format)) throw new Error(`Unknown format '${values.format}'.`);
  if (!validThresholds.has(values["fail-on"]))
    throw new Error(`Unknown fail threshold '${values["fail-on"]}'.`);
  const maxBytes = Number(values["max-size"]);
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1)
    throw new Error("--max-size must be a positive integer.");

  const config: FormKindConfig = await loadConfig(values.config);
  config.ignore = [...(config.ignore ?? []), ...(values.ignore ?? [])];
  const loaded = (await Promise.all(positionals.map((input) => loadInput(input, maxBytes)))).flat();
  if (loaded.length === 0) throw new Error("No .html or .htm files were found.");
  const result = combineResults(
    loaded.map((source) => analyzeHtml(source.html, { file: source.name, config })),
  );
  const output = report(result, format);
  if (values.output) await writeFile(values.output, output, "utf8");
  else console.log(output);
  if (reachesThreshold(result.summary, values["fail-on"])) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(`formkind: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
});
