import { access, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { runRemediationAgent } from "./agent/orchestrator.js";
import { OfflineAgentProvider, OpenAIResponsesProvider } from "./agent/provider.js";
import { type AgentFormat, reportAgentPlan } from "./agent/reporter.js";
import type { AgentGoal } from "./agent/types.js";
import { analyzeHtml, combineResults } from "./analyzer.js";
import { loadBaseline, withoutBaseline, writeBaseline } from "./baseline.js";
import { loadConfig } from "./config.js";
import { loadInput } from "./input.js";
import { profileNames } from "./profiles.js";
import { type Format, report } from "./reporters.js";
import { rules } from "./rules.js";
import type { AuditResult, FormKindConfig, LoadedSource, ProfileName, Severity } from "./types.js";

const version = "0.3.0";
const commands = new Set(["scan", "rules", "init", "baseline", "agent"]);
const validFormats = new Set<Format>(["pretty", "json", "markdown", "sarif"]);
const validThresholds = new Set(["error", "warning", "never"]);
const validAgentGoals = new Set<AgentGoal>(["assess", "plan", "review"]);

function help(): string {
  return `FormKind ${version} - global-readiness tooling for forms

Usage:
  formkind [scan] <file|directory|url> [...] [options]
  formkind rules [--format pretty|json|markdown]
  formkind init [--profile global|strict|commerce|public-sector]
  formkind baseline <file|directory> [...] [--output .formkind-baseline.json]
  formkind agent <file|directory> [...] [--goal assess|plan|review]

Scan options:
  --profile <name>                      Policy profile (default: global)
  --format <pretty|json|markdown|sarif> Output format (default: pretty)
  --output <path>                       Write the report to a file
  --config <path>                       Config file (default: .formkindrc.json)
  --baseline <path>                     Report only findings absent from a baseline
  --ignore <rule>                       Ignore a rule; repeatable
  --fail-on <error|warning|never>       Exit 1 at this severity (default: error)
  --max-size <bytes>                    Maximum bytes per input (default: 2000000)
  --force                               Allow init/baseline to overwrite its output
  --version                             Print the version
  --help                                Show this help

Agent options (explicit opt-in):
  --goal <assess|plan|review>           Agent outcome (default: plan)
  --model <name>                        OpenAI Responses model (default: gpt-5.6-terra)
  --markets <locale,...>                Target locales or markets (default: global)
  --max-findings <number>               Finding budget sent to specialists (default: 40)
  --max-specialists <number>            Parallel category specialists (default: 5)
  --offline                             Build a deterministic plan without an API call
  --api-base <url>                      OpenAI-compatible Responses API base URL

Supported source: HTML, JSX, TSX, Vue, Svelte, directories, and public URLs.

Examples:
  formkind scan ./src --profile strict
  formkind ./public --baseline .formkind-baseline.json
  formkind baseline ./legacy-app
  formkind agent ./src --goal plan --markets en-US,ar-SA,ja-JP --format markdown
  formkind agent ./src --offline --output formkind-plan.md
  formkind rules --format markdown
  formkind init --profile commerce`;
}

function reachesThreshold(summary: Record<Severity, number>, threshold: string): boolean {
  if (threshold === "never") return false;
  if (threshold === "warning") return summary.error > 0 || summary.warning > 0;
  return summary.error > 0;
}

async function assertWritable(path: string, force: boolean): Promise<void> {
  if (force) return;
  try {
    await access(path);
    throw new Error(`${path} already exists. Pass --force to replace it.`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function rulesReport(format: string): string {
  if (format === "json") {
    return JSON.stringify(
      rules.map(({ id, category, severity, description, help }) => ({
        id,
        category,
        severity,
        description,
        help,
      })),
      null,
      2,
    );
  }
  if (format === "markdown") {
    return [
      "# FormKind rule catalog",
      "",
      "| Rule | Category | Default | Check |",
      "| --- | --- | --- | --- |",
      ...rules.map(
        (rule) => `| ${rule.id} | ${rule.category} | ${rule.severity} | ${rule.description} |`,
      ),
      "",
    ].join("\n");
  }
  return rules
    .map(
      (rule) =>
        `${rule.id.padEnd(6)} ${rule.severity.padEnd(7)} ${rule.category.padEnd(14)} ${rule.description}`,
    )
    .join("\n");
}

async function audit(
  inputs: string[],
  maxBytes: number,
  config: FormKindConfig,
): Promise<{ result: AuditResult; sources: LoadedSource[] }> {
  const loaded = (await Promise.all(inputs.map((input) => loadInput(input, maxBytes)))).flat();
  const exclusions = (config.exclude ?? []).map((value) => value.replaceAll("\\", "/"));
  const included = loaded.filter((source) => {
    const name = source.name.replaceAll("\\", "/");
    return !exclusions.some((excluded) => name.includes(excluded));
  });
  if (included.length === 0)
    throw new Error("No supported source files were found after exclusions.");
  return {
    result: combineResults(
      included.map((source) => analyzeHtml(source.html, { file: source.name, config })),
    ),
    sources: included,
  };
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      profile: { type: "string" },
      format: { type: "string", default: "pretty" },
      output: { type: "string", short: "o" },
      config: { type: "string" },
      baseline: { type: "string" },
      ignore: { type: "string", multiple: true },
      "fail-on": { type: "string", default: "error" },
      "max-size": { type: "string", default: "2000000" },
      goal: { type: "string", default: "plan" },
      model: { type: "string" },
      markets: { type: "string", default: "global" },
      "max-findings": { type: "string", default: "40" },
      "max-specialists": { type: "string", default: "5" },
      offline: { type: "boolean", default: false },
      "api-base": { type: "string" },
      force: { type: "boolean", default: false },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  if (values.version) {
    console.log(version);
    return;
  }
  if (values.help) {
    console.log(help());
    return;
  }

  const command = commands.has(positionals[0] ?? "") ? positionals.shift() : "scan";
  const format = values.format as Format;
  if (!validFormats.has(format)) throw new Error(`Unknown format '${values.format}'.`);
  if (!validThresholds.has(values["fail-on"])) {
    throw new Error(`Unknown fail threshold '${values["fail-on"]}'.`);
  }
  if (values.profile && !profileNames.includes(values.profile as ProfileName)) {
    throw new Error(`Unknown profile '${values.profile}'.`);
  }

  if (command === "rules") {
    if (format === "sarif") throw new Error("The rule catalog supports pretty, JSON, or Markdown.");
    const output = rulesReport(format);
    if (values.output) await writeFile(values.output, output, "utf8");
    else console.log(output);
    return;
  }

  if (command === "init") {
    const path = values.output ?? ".formkindrc.json";
    await assertWritable(path, values.force);
    const config = {
      profile: (values.profile ?? "global") as ProfileName,
      exclude: ["node_modules/", "dist/", "coverage/"],
      ignore: [],
      severity: { FK008: "warning" },
    };
    await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    console.log(`Created ${path} with the '${config.profile}' profile.`);
    return;
  }

  if (positionals.length === 0) {
    console.log(help());
    process.exitCode = 2;
    return;
  }
  const maxBytes = Number(values["max-size"]);
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new Error("--max-size must be a positive integer.");
  }
  const config = await loadConfig(values.config);
  if (values.profile) config.profile = values.profile as ProfileName;
  config.ignore = [...(config.ignore ?? []), ...(values.ignore ?? [])];
  const audited = await audit(positionals, maxBytes, config);
  let result = audited.result;

  if (command === "baseline") {
    const path = values.output ?? ".formkind-baseline.json";
    await assertWritable(path, values.force);
    const baseline = await writeBaseline(path, result);
    console.log(`Wrote ${baseline.fingerprints.length} finding fingerprints to ${path}.`);
    return;
  }

  if (command === "agent") {
    const goal = values.goal as AgentGoal;
    if (!validAgentGoals.has(goal)) throw new Error(`Unknown agent goal '${values.goal}'.`);
    const agentFormat: AgentFormat = values.format === "json" ? "json" : "markdown";
    if (!new Set(["pretty", "json", "markdown"]).has(values.format)) {
      throw new Error("Agent output supports Markdown or JSON.");
    }
    const maxFindings = Number(values["max-findings"]);
    const maxSpecialists = Number(values["max-specialists"]);
    const provider = values.offline
      ? new OfflineAgentProvider()
      : new OpenAIResponsesProvider({
          ...(values.model ? { model: values.model } : {}),
          ...(values["api-base"] ? { baseUrl: values["api-base"] } : {}),
        });
    const plan = await runRemediationAgent({
      audit: result,
      sources: audited.sources,
      provider,
      goal,
      markets: values.markets
        .split(",")
        .map((market) => market.trim())
        .filter(Boolean),
      maxFindings,
      maxSpecialists,
    });
    const output = reportAgentPlan(plan, agentFormat);
    if (values.output) await writeFile(values.output, output, "utf8");
    else console.log(output);
    return;
  }

  if (values.baseline) result = withoutBaseline(result, await loadBaseline(values.baseline));
  const output = report(result, format);
  if (values.output) await writeFile(values.output, output, "utf8");
  else console.log(output);
  if (reachesThreshold(result.summary, values["fail-on"])) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(`formkind: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
});
