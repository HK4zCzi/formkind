import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import type { LoadedSource } from "./types.js";

const supportedExtensions = new Set([".html", ".htm", ".jsx", ".tsx", ".vue", ".svelte"]);
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  ".next",
  ".nuxt",
  ".svelte-kit",
  "vendor",
]);

function syntaxFor(path: string): LoadedSource["syntax"] {
  const extension = extname(path).toLowerCase();
  if (extension === ".jsx" || extension === ".tsx") return "jsx";
  if (extension === ".vue") return "vue";
  if (extension === ".svelte") return "svelte";
  return "html";
}

function prepareMarkup(source: string, syntax: LoadedSource["syntax"]): string {
  if (syntax === "html" || syntax === "remote") return source;
  let markup = source;
  if (syntax === "vue") {
    const template = source.match(/<template(?:\s[^>]*)?>([\s\S]*?)<\/template>/i);
    if (template?.[1]) {
      const prefixLines = source.slice(0, template.index ?? 0).split("\n").length;
      markup = `${"\n".repeat(prefixLines)}${template[1]}`;
    }
  }
  return markup
    .replaceAll("htmlFor=", "for=")
    .replace(/\b(maxLength|minLength|inputMode|autoComplete)=/g, (name) => name.toLowerCase())
    .replace(/=\{\s*(true|false|\d+)\s*\}/g, '="$1"')
    .replace(/=\{[^{}\n]*\}/g, '=""')
    .replace(/<([a-z][\w:-]*)([^>]*)\/>/gi, "<$1$2></$1>");
}

async function sourceFromFile(path: string, name: string): Promise<LoadedSource> {
  const syntax = syntaxFor(path);
  const source = await readFile(path, "utf8");
  return { name, html: prepareMarkup(source, syntax), syntax };
}

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
      sources.push(await sourceFromFile(path, relative(process.cwd(), path) || entry.name));
    }
  }
  return sources;
}

async function readUrl(url: string, maxBytes: number): Promise<LoadedSource> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "formkind/0.2 (+https://github.com/khanhcamap2020-sudo/formkind)",
    },
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
  return { name: url, html, syntax: "remote" };
}

export async function loadInput(input: string, maxBytes = 2_000_000): Promise<LoadedSource[]> {
  if (/^https?:\/\//i.test(input)) return [await readUrl(input, maxBytes)];
  const path = resolve(input);
  const details = await stat(path);
  if (details.isDirectory()) return readDirectory(path, maxBytes);
  if (!supportedExtensions.has(extname(path).toLowerCase())) {
    throw new Error(
      `Unsupported file '${input}'. FormKind accepts HTML, JSX, TSX, Vue, and Svelte files.`,
    );
  }
  if (details.size > maxBytes) throw new Error(`${input} exceeds the ${maxBytes}-byte limit.`);
  return [await sourceFromFile(path, relative(process.cwd(), path) || input)];
}
