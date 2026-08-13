// src/analyzer.ts
import { parse } from "parse5";

// src/rules.ts
function getAttribute(element, name) {
  return element.attrs.find((attribute) => attribute.name.toLowerCase() === name)?.value;
}
function hasAttribute(element, name) {
  return element.attrs.some((attribute) => attribute.name.toLowerCase() === name);
}
function elementText(node) {
  if ("value" in node && typeof node.value === "string") return node.value;
  if (!("childNodes" in node)) return "";
  return node.childNodes.map(elementText).join(" ").replace(/\s+/g, " ").trim();
}
function fieldIdentity(element, labels) {
  const id = getAttribute(element, "id");
  const label = id ? labels.get(id) : void 0;
  return [
    getAttribute(element, "name"),
    id,
    getAttribute(element, "autocomplete"),
    getAttribute(element, "aria-label"),
    getAttribute(element, "placeholder"),
    label
  ].filter(Boolean).join(" ").toLowerCase();
}
function isNameField(element, labels) {
  const identity = fieldIdentity(element, labels);
  return /(^|[\s_-])(full[\s_-]?)?name([\s_-]|$)|given-name|family-name/.test(identity);
}
function isContactField(element, labels) {
  const identity = fieldIdentity(element, labels);
  return /(name|address|street|city|town|postal|zip|email|phone|tel)/.test(identity);
}
function inputElements(context) {
  return context.elements.filter((element) => element.tagName === "input");
}
var rules = [
  {
    id: "FK001",
    severity: "warning",
    description: "Document language is declared",
    help: "Set a valid lang attribute on the html element so browsers and assistive tools know the page language.",
    check(context) {
      const html = context.elements.find((element) => element.tagName === "html");
      if (!html || !getAttribute(html, "lang")?.trim()) {
        const location = html ?? context.elements[0];
        return location ? [context.finding(this, location)] : [];
      }
      return [];
    }
  },
  {
    id: "FK002",
    severity: "error",
    description: "Personal names accept Unicode letters",
    help: "Remove ASCII-only patterns. Human names can contain Unicode letters, spaces, apostrophes, and hyphens.",
    check(context) {
      return inputElements(context).filter((element) => isNameField(element, context.labels)).filter((element) => {
        const pattern = getAttribute(element, "pattern") ?? "";
        return /\[(?:A-Z|a-z|A-Za-z|a-zA-Z)/.test(pattern) && !/\\p\{L\}/.test(pattern);
      }).map((element) => context.finding(this, element));
    }
  },
  {
    id: "FK003",
    severity: "warning",
    description: "Personal name fields are not artificially short",
    help: "Allow at least 50 characters for each name field, and avoid maxlength when storage supports longer values.",
    check(context) {
      return inputElements(context).filter((element) => isNameField(element, context.labels)).filter((element) => Number(getAttribute(element, "maxlength")) > 0).filter((element) => Number(getAttribute(element, "maxlength")) < 50).map((element) => context.finding(this, element));
    }
  },
  {
    id: "FK004",
    severity: "error",
    description: "Telephone fields allow international-length numbers",
    help: "Allow at least 16 characters for a leading plus sign and up to 15 E.164 digits; allow more if formatting characters are accepted.",
    check(context) {
      return inputElements(context).filter((element) => getAttribute(element, "type")?.toLowerCase() === "tel").filter((element) => Number(getAttribute(element, "maxlength")) > 0).filter((element) => Number(getAttribute(element, "maxlength")) < 16).map((element) => context.finding(this, element));
    }
  },
  {
    id: "FK005",
    severity: "error",
    description: "Telephone patterns allow a leading country code",
    help: "Accept a leading + and country code. Normalize and validate phone numbers after input instead of enforcing a domestic shape in HTML.",
    check(context) {
      return inputElements(context).filter((element) => getAttribute(element, "type")?.toLowerCase() === "tel").filter((element) => {
        const pattern = getAttribute(element, "pattern");
        return Boolean(pattern && !pattern.includes("+") && !pattern.includes("\\+"));
      }).map((element) => context.finding(this, element));
    }
  },
  {
    id: "FK006",
    severity: "warning",
    description: "Postal labels are not country-specific",
    help: "Prefer 'Postal code' over 'ZIP code', or change the label when the selected country changes.",
    check(context) {
      return context.elements.filter((element) => element.tagName === "label").filter((element) => /\bzip(?:\s+code)?\b/i.test(elementText(element))).map((element) => context.finding(this, element));
    }
  },
  {
    id: "FK007",
    severity: "warning",
    description: "Dates avoid ambiguous locale-specific placeholders",
    help: "Use input type=date or a localized date picker with an unambiguous example and machine-readable value.",
    check(context) {
      return inputElements(context).filter((element) => (getAttribute(element, "type") ?? "text").toLowerCase() !== "date").filter(
        (element) => /(?:mm|dd)[\s./-]+(?:dd|mm)[\s./-]+(?:yy|yyyy)/i.test(
          getAttribute(element, "placeholder") ?? ""
        )
      ).map((element) => context.finding(this, element));
    }
  },
  {
    id: "FK008",
    severity: "info",
    description: "Contact fields expose autocomplete tokens",
    help: "Add a standard autocomplete token such as name, email, tel, street-address, address-level2, postal-code, or country-name.",
    check(context) {
      return inputElements(context).filter((element) => isContactField(element, context.labels)).filter((element) => !hasAttribute(element, "autocomplete")).map((element) => context.finding(this, element));
    }
  },
  {
    id: "FK009",
    severity: "warning",
    description: "Required region fields have country context",
    help: "Do not require a state, province, or region unless the selected country needs it; provide a country field and adapt the form.",
    check(context) {
      const hasCountry = context.elements.some(
        (element) => /(^|[\s_-])country([\s_-]|$)/.test(fieldIdentity(element, context.labels))
      );
      if (hasCountry) return [];
      return context.elements.filter((element) => element.tagName === "input" || element.tagName === "select").filter((element) => hasAttribute(element, "required")).filter(
        (element) => /(^|[\s_-])(state|province|region)([\s_-]|$)/.test(
          fieldIdentity(element, context.labels)
        )
      ).map((element) => context.finding(this, element));
    }
  }
];

// src/analyzer.ts
function collectElements(node, output = []) {
  if ("tagName" in node) output.push(node);
  if ("childNodes" in node) {
    for (const child of node.childNodes) collectElements(child, output);
  }
  return output;
}
function textContent(node) {
  if ("value" in node && typeof node.value === "string") return node.value;
  if (!("childNodes" in node)) return "";
  return node.childNodes.map(textContent).join(" ").replace(/\s+/g, " ").trim();
}
function labelsByControl(elements) {
  const labels = /* @__PURE__ */ new Map();
  for (const label of elements.filter((element) => element.tagName === "label")) {
    const target = getAttribute(label, "for");
    if (target) labels.set(target, textContent(label));
  }
  return labels;
}
function locationOf(element) {
  const location = element.sourceCodeLocation;
  return {
    line: location?.startLine ?? 1,
    column: location?.startCol ?? 1
  };
}
function calculateScore(findings) {
  const cost = { error: 15, warning: 7, info: 2 };
  return Math.max(0, 100 - findings.reduce((total, finding) => total + cost[finding.severity], 0));
}
function configuredSeverity(rule, options) {
  return options.config?.severity?.[rule.id] ?? rule.severity;
}
function analyzeHtml(html, options = {}) {
  const file = options.file ?? "<inline>";
  const document = parse(html, { sourceCodeLocationInfo: true });
  const elements = collectElements(document);
  const labels = labelsByControl(elements);
  const ignored = new Set(options.config?.ignore ?? []);
  const findings = [];
  for (const rule of rules) {
    const severity = configuredSeverity(rule, options);
    if (ignored.has(rule.id) || severity === "off") continue;
    const results = rule.check({
      file,
      elements,
      labels,
      finding: (activeRule, element, message) => ({
        ruleId: activeRule.id,
        severity,
        message: message ?? activeRule.description,
        help: activeRule.help,
        file,
        location: locationOf(element)
      })
    });
    findings.push(...results);
  }
  findings.sort(
    (left, right) => left.file.localeCompare(right.file) || left.location.line - right.location.line || left.location.column - right.location.column || left.ruleId.localeCompare(right.ruleId)
  );
  const summary = { error: 0, warning: 0, info: 0 };
  for (const finding of findings) summary[finding.severity] += 1;
  return {
    files: [file],
    findings,
    score: calculateScore(findings),
    summary
  };
}
function combineResults(results) {
  const findings = results.flatMap((result) => result.findings);
  const summary = { error: 0, warning: 0, info: 0 };
  for (const finding of findings) summary[finding.severity] += 1;
  return {
    files: results.flatMap((result) => result.files),
    findings,
    score: calculateScore(findings),
    summary
  };
}

// src/config.ts
import { readFile } from "fs/promises";
import { resolve } from "path";
var allowedSeverities = /* @__PURE__ */ new Set(["error", "warning", "info", "off"]);
async function loadConfig(path = ".formkindrc.json") {
  let raw;
  try {
    raw = await readFile(resolve(path), "utf8");
  } catch (error) {
    const code = error.code;
    if (code === "ENOENT" && path === ".formkindrc.json") return {};
    throw error;
  }
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("FormKind config must be a JSON object.");
  }
  const config = parsed;
  if (config.ignore && (!Array.isArray(config.ignore) || config.ignore.some((id) => typeof id !== "string"))) {
    throw new Error("FormKind config 'ignore' must be an array of rule IDs.");
  }
  if (config.severity) {
    for (const [ruleId, severity] of Object.entries(config.severity)) {
      if (severity === void 0 || !allowedSeverities.has(severity)) {
        throw new Error(`Invalid severity '${severity}' for ${ruleId}.`);
      }
    }
  }
  return config;
}

// src/input.ts
import { readdir, readFile as readFile2, stat } from "fs/promises";
import { extname, join, relative, resolve as resolve2 } from "path";
var supportedExtensions = /* @__PURE__ */ new Set([".html", ".htm"]);
var ignoredDirectories = /* @__PURE__ */ new Set([".git", "node_modules", "dist", "coverage", ".next"]);
async function readDirectory(directory, maxBytes) {
  const sources = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) sources.push(...await readDirectory(path, maxBytes));
    if (entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase())) {
      const details = await stat(path);
      if (details.size > maxBytes) throw new Error(`${path} exceeds the ${maxBytes}-byte limit.`);
      sources.push({
        name: relative(process.cwd(), path) || entry.name,
        html: await readFile2(path, "utf8")
      });
    }
  }
  return sources;
}
async function readUrl(url, maxBytes) {
  const response = await fetch(url, {
    headers: { "user-agent": "formkind/0.1 (+https://github.com/HK4zCzi/formkind)" },
    signal: AbortSignal.timeout(1e4)
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
async function loadInput(input, maxBytes = 2e6) {
  if (/^https?:\/\//i.test(input)) return [await readUrl(input, maxBytes)];
  const path = resolve2(input);
  const details = await stat(path);
  if (details.isDirectory()) return readDirectory(path, maxBytes);
  if (!supportedExtensions.has(extname(path).toLowerCase())) {
    throw new Error(`Unsupported file '${input}'. FormKind accepts .html and .htm files.`);
  }
  if (details.size > maxBytes) throw new Error(`${input} exceeds the ${maxBytes}-byte limit.`);
  return [{ name: relative(process.cwd(), path) || input, html: await readFile2(path, "utf8") }];
}

// src/reporters.ts
function icon(severity) {
  return severity === "error" ? "x" : severity === "warning" ? "!" : "i";
}
function pretty(result) {
  const lines = result.findings.map(
    (finding) => `${icon(finding.severity)} ${finding.file}:${finding.location.line}:${finding.location.column} ${finding.severity.toUpperCase()} ${finding.ruleId} ${finding.message}`
  );
  lines.push(
    "",
    `FormKind score: ${result.score}/100 | ${result.files.length} file(s) | ${result.summary.error} error(s), ${result.summary.warning} warning(s), ${result.summary.info} info`
  );
  return lines.join("\n");
}
function markdown(result) {
  const lines = [
    "# FormKind report",
    "",
    `**Score:** ${result.score}/100 across ${result.files.length} file(s).`,
    "",
    "| Severity | Rule | Location | Message |",
    "| --- | --- | --- | --- |"
  ];
  for (const finding of result.findings) {
    lines.push(
      `| ${finding.severity} | ${finding.ruleId} | ${finding.file}:${finding.location.line}:${finding.location.column} | ${finding.message} |`
    );
  }
  if (result.findings.length === 0) lines.push("| - | - | - | No findings. | ");
  return `${lines.join("\n")}
`;
}
function sarif(result) {
  const levels = {
    error: "error",
    warning: "warning",
    info: "note"
  };
  const usedRuleIds = new Set(result.findings.map((finding) => finding.ruleId));
  return JSON.stringify(
    {
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      version: "2.1.0",
      runs: [
        {
          tool: {
            driver: {
              name: "FormKind",
              informationUri: "https://github.com/HK4zCzi/formkind",
              version: "0.1.0",
              rules: rules.filter((rule) => usedRuleIds.has(rule.id)).map((rule) => ({
                id: rule.id,
                shortDescription: { text: rule.description },
                help: { text: rule.help }
              }))
            }
          },
          results: result.findings.map((finding) => ({
            ruleId: finding.ruleId,
            level: levels[finding.severity],
            message: { text: `${finding.message} ${finding.help}` },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: finding.file.replaceAll("\\", "/") },
                  region: {
                    startLine: finding.location.line,
                    startColumn: finding.location.column
                  }
                }
              }
            ]
          }))
        }
      ]
    },
    null,
    2
  );
}
function report(result, format) {
  if (format === "json") return JSON.stringify(result, null, 2);
  if (format === "markdown") return markdown(result);
  if (format === "sarif") return sarif(result);
  return pretty(result);
}
export {
  analyzeHtml,
  combineResults,
  loadConfig,
  loadInput,
  report,
  rules
};
