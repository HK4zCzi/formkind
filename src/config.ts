import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { profileNames } from "./profiles.js";
import type { FormKindConfig, Severity } from "./types.js";

const allowedSeverities = new Set<Severity | "off">(["error", "warning", "info", "off"]);

export async function loadConfig(path = ".formkindrc.json"): Promise<FormKindConfig> {
  let raw: string;
  try {
    raw = await readFile(resolve(path), "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" && path === ".formkindrc.json") return {};
    throw error;
  }

  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("FormKind config must be a JSON object.");
  }
  const config = parsed as FormKindConfig;
  if (config.profile && !profileNames.includes(config.profile)) {
    throw new Error(`Unknown FormKind profile '${config.profile}'.`);
  }
  if (
    config.ignore &&
    (!Array.isArray(config.ignore) || config.ignore.some((id) => typeof id !== "string"))
  ) {
    throw new Error("FormKind config 'ignore' must be an array of rule IDs.");
  }
  if (config.severity) {
    for (const [ruleId, severity] of Object.entries(config.severity)) {
      if (severity === undefined || !allowedSeverities.has(severity)) {
        throw new Error(`Invalid severity '${severity}' for ${ruleId}.`);
      }
    }
  }
  if (
    config.exclude &&
    (!Array.isArray(config.exclude) || config.exclude.some((item) => typeof item !== "string"))
  ) {
    throw new Error("FormKind config 'exclude' must be an array of path fragments.");
  }
  return config;
}
