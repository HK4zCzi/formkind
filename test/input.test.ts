import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadInput } from "../src/input.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe("loadInput", () => {
  it("recursively loads HTML and ignores unsupported files and dependency folders", async () => {
    const directory = await mkdtemp(join(tmpdir(), "formkind-input-"));
    temporaryDirectories.push(directory);
    await mkdir(join(directory, "pages"));
    await mkdir(join(directory, "node_modules"));
    await writeFile(join(directory, "index.html"), "<html lang='en'></html>");
    await writeFile(join(directory, "pages", "contact.htm"), "<html lang='fr'></html>");
    await writeFile(join(directory, "readme.txt"), "ignored");
    await writeFile(join(directory, "node_modules", "bad.html"), "ignored");

    const sources = await loadInput(directory);
    expect(sources).toHaveLength(2);
    expect(sources.map((source) => source.name.replaceAll("\\", "/"))).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/index\.html$/),
        expect.stringMatching(/pages\/contact\.htm$/),
      ]),
    );
  });

  it("rejects unsupported extensions and oversized files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "formkind-input-"));
    temporaryDirectories.push(directory);
    const text = join(directory, "notes.txt");
    const html = join(directory, "large.html");
    await writeFile(text, "hello");
    await writeFile(html, "12345");

    await expect(loadInput(text)).rejects.toThrow("Unsupported file");
    await expect(loadInput(html, 4)).rejects.toThrow("exceeds");
  });
});
