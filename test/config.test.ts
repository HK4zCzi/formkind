import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

async function configFile(contents: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "formkind-config-"));
  temporaryDirectories.push(directory);
  const path = join(directory, ".formkindrc.json");
  await writeFile(path, contents);
  return path;
}

describe("loadConfig", () => {
  it("loads a valid config", async () => {
    const path = await configFile('{"ignore":["FK001"],"severity":{"FK008":"off"}}');
    await expect(loadConfig(path)).resolves.toEqual({
      ignore: ["FK001"],
      severity: { FK008: "off" },
    });
  });

  it("rejects invalid severity values", async () => {
    const path = await configFile('{"severity":{"FK001":"critical"}}');
    await expect(loadConfig(path)).rejects.toThrow("Invalid severity");
  });

  it("rejects invalid ignore values", async () => {
    const path = await configFile('{"ignore":"FK001"}');
    await expect(loadConfig(path)).rejects.toThrow("must be an array");
  });
});
