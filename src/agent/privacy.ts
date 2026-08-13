import type { Finding, LoadedSource } from "../types.js";
import type { SourceExcerpt } from "./types.js";

const secretPatterns: Array<[RegExp, string]> = [
  [/(api[_-]?key\s*[:=]\s*["'])[^"']+(["'])/gi, "$1[REDACTED]$2"],
  [/(token\s*[:=]\s*["'])[^"']+(["'])/gi, "$1[REDACTED]$2"],
  [/(secret\s*[:=]\s*["'])[^"']+(["'])/gi, "$1[REDACTED]$2"],
  [/(authorization\s*[:=]\s*["'])[^"']+(["'])/gi, "$1[REDACTED]$2"],
];

export function redactExcerpt(value: string): string {
  let redacted = value;
  for (const [pattern, replacement] of secretPatterns) redacted = redacted.replace(pattern, replacement);
  return redacted.replace(/(<input\b[^>]*\bvalue=["'])[^"']+(["'][^>]*>)/gi, "$1[REDACTED]$2");
}

export function excerptsForFindings(
  sources: LoadedSource[],
  findings: Finding[],
  radius = 4,
): SourceExcerpt[] {
  const byName = new Map(sources.map((source) => [source.name.replaceAll("\\", "/"), source]));
  const seen = new Set<string>();
  const excerpts: SourceExcerpt[] = [];

  for (const finding of findings) {
    const normalized = finding.file.replaceAll("\\", "/");
    const source = byName.get(normalized);
    if (!source) continue;
    const lines = source.html.split("\n");
    const startLine = Math.max(1, finding.location.line - radius);
    const endLine = Math.min(lines.length, finding.location.line + radius);
    const key = `${normalized}:${startLine}:${endLine}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const numbered = lines
      .slice(startLine - 1, endLine)
      .map((line, index) => `${String(startLine + index).padStart(4)} | ${line}`)
      .join("\n");
    excerpts.push({
      file: finding.file,
      startLine,
      endLine,
      content: redactExcerpt(numbered).slice(0, 8_000),
    });
  }

  return excerpts.slice(0, 20);
}
