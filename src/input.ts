import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import type { LoadedSource } from "./types.js";

const supportedExtensions = new Set([".html", ".htm"]);
const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage", ".next"]);

async function readDirectory(directory: string, maxBytes: number): Promise<LoadedSource[]> {
  const sources: LoadedSource[] = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) sources.push(...(await readDirectory(path, maxBytes)));
    if (entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase())) {
      const details = await stat(path);
      if (details.size > maxBytes) throw new Error(`${path} exceeds the ${maxBytes}-byte limit.`);
      sources.push({
        name: relative(process.cwd(), path) || entry.name,
        html: await readFile(path, "utf8"),
      });
    }
  }
  return sources;
}

async function readUrl(url: string, maxBytes: number): Promise<LoadedSource> {
  const response = await fetch(url, {
    headers: { "user-agent": "formkind/0.1 (+https://github.com/HK4zCzi/formkind)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error(`${url} did not return HTML (received '${contentType || "unknown"}').`);
  }
  const declaredSize = Number(response.headers.get("content-length"));
  if (declaredSize > maxBytes) throw new Error(`${url} exceeds the ${maxBytes}-byte limit.`);
  const html = await response.text();
  if (Buffer.byteLength(html) > maxBytes)
    throw new Error(`${url} exceeds the ${maxBytes}-byte limit.`);
  return { name: url, html };
}

export async function loadInput(input: string, maxBytes = 2_000_000): Promise<LoadedSource[]> {
  if (/^https?:\/\//i.test(input)) return [await readUrl(input, maxBytes)];
  const path = resolve(input);
  const details = await stat(path);
  if (details.isDirectory()) return readDirectory(path, maxBytes);
  if (!supportedExtensions.has(extname(path).toLowerCase())) {
    throw new Error(`Unsupported file '${input}'. FormKind accepts .html and .htm files.`);
  }
  if (details.size > maxBytes) throw new Error(`${input} exceeds the ${maxBytes}-byte limit.`);
  return [{ name: relative(process.cwd(), path) || input, html: await readFile(path, "utf8") }];
}
