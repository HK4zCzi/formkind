import type { DefaultTreeAdapterMap } from "parse5";
import type { Finding, Severity } from "./types.js";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];

export interface RuleContext {
  file: string;
  elements: Element[];
  labels: Map<string, string>;
  finding: (rule: Rule, element: Element, message?: string) => Finding;
}

export interface Rule {
  id: string;
  severity: Severity;
  description: string;
  help: string;
  check: (context: RuleContext) => Finding[];
}

export function getAttribute(element: Element, name: string): string | undefined {
  return element.attrs.find((attribute) => attribute.name.toLowerCase() === name)?.value;
}

function hasAttribute(element: Element, name: string): boolean {
  return element.attrs.some((attribute) => attribute.name.toLowerCase() === name);
}

function elementText(node: Node): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if (!("childNodes" in node)) return "";
  return node.childNodes.map(elementText).join(" ").replace(/\s+/g, " ").trim();
}

function fieldIdentity(element: Element, labels: Map<string, string>): string {
  const id = getAttribute(element, "id");
  const label = id ? labels.get(id) : undefined;
  return [
    getAttribute(element, "name"),
    id,
    getAttribute(element, "autocomplete"),
    getAttribute(element, "aria-label"),
    getAttribute(element, "placeholder"),
    label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isNameField(element: Element, labels: Map<string, string>): boolean {
  const identity = fieldIdentity(element, labels);
  return /(^|[\s_-])(full[\s_-]?)?name([\s_-]|$)|given-name|family-name/.test(identity);
}

function isContactField(element: Element, labels: Map<string, string>): boolean {
  const identity = fieldIdentity(element, labels);
  return /(name|address|street|city|town|postal|zip|email|phone|tel)/.test(identity);
}

function inputElements(context: RuleContext): Element[] {
  return context.elements.filter((element) => element.tagName === "input");
}

export const rules: Rule[] = [
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
    },
  },
  {
    id: "FK002",
    severity: "error",
    description: "Personal names accept Unicode letters",
    help: "Remove ASCII-only patterns. Human names can contain Unicode letters, spaces, apostrophes, and hyphens.",
    check(context) {
      return inputElements(context)
        .filter((element) => isNameField(element, context.labels))
        .filter((element) => {
          const pattern = getAttribute(element, "pattern") ?? "";
          return /\[(?:A-Z|a-z|A-Za-z|a-zA-Z)/.test(pattern) && !/\\p\{L\}/.test(pattern);
        })
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK003",
    severity: "warning",
    description: "Personal name fields are not artificially short",
    help: "Allow at least 50 characters for each name field, and avoid maxlength when storage supports longer values.",
    check(context) {
      return inputElements(context)
        .filter((element) => isNameField(element, context.labels))
        .filter((element) => Number(getAttribute(element, "maxlength")) > 0)
        .filter((element) => Number(getAttribute(element, "maxlength")) < 50)
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK004",
    severity: "error",
    description: "Telephone fields allow international-length numbers",
    help: "Allow at least 16 characters for a leading plus sign and up to 15 E.164 digits; allow more if formatting characters are accepted.",
    check(context) {
      return inputElements(context)
        .filter((element) => getAttribute(element, "type")?.toLowerCase() === "tel")
        .filter((element) => Number(getAttribute(element, "maxlength")) > 0)
        .filter((element) => Number(getAttribute(element, "maxlength")) < 16)
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK005",
    severity: "error",
    description: "Telephone patterns allow a leading country code",
    help: "Accept a leading + and country code. Normalize and validate phone numbers after input instead of enforcing a domestic shape in HTML.",
    check(context) {
      return inputElements(context)
        .filter((element) => getAttribute(element, "type")?.toLowerCase() === "tel")
        .filter((element) => {
          const pattern = getAttribute(element, "pattern");
          return Boolean(pattern && !pattern.includes("+") && !pattern.includes("\\+"));
        })
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK006",
    severity: "warning",
    description: "Postal labels are not country-specific",
    help: "Prefer 'Postal code' over 'ZIP code', or change the label when the selected country changes.",
    check(context) {
      return context.elements
        .filter((element) => element.tagName === "label")
        .filter((element) => /\bzip(?:\s+code)?\b/i.test(elementText(element)))
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK007",
    severity: "warning",
    description: "Dates avoid ambiguous locale-specific placeholders",
    help: "Use input type=date or a localized date picker with an unambiguous example and machine-readable value.",
    check(context) {
      return inputElements(context)
        .filter((element) => (getAttribute(element, "type") ?? "text").toLowerCase() !== "date")
        .filter((element) =>
          /(?:mm|dd)[\s./-]+(?:dd|mm)[\s./-]+(?:yy|yyyy)/i.test(
            getAttribute(element, "placeholder") ?? "",
          ),
        )
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK008",
    severity: "info",
    description: "Contact fields expose autocomplete tokens",
    help: "Add a standard autocomplete token such as name, email, tel, street-address, address-level2, postal-code, or country-name.",
    check(context) {
      return inputElements(context)
        .filter((element) => isContactField(element, context.labels))
        .filter((element) => !hasAttribute(element, "autocomplete"))
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK009",
    severity: "warning",
    description: "Required region fields have country context",
    help: "Do not require a state, province, or region unless the selected country needs it; provide a country field and adapt the form.",
    check(context) {
      const hasCountry = context.elements.some((element) =>
        /(^|[\s_-])country([\s_-]|$)/.test(fieldIdentity(element, context.labels)),
      );
      if (hasCountry) return [];
      return context.elements
        .filter((element) => element.tagName === "input" || element.tagName === "select")
        .filter((element) => hasAttribute(element, "required"))
        .filter((element) =>
          /(^|[\s_-])(state|province|region)([\s_-]|$)/.test(
            fieldIdentity(element, context.labels),
          ),
        )
        .map((element) => context.finding(this, element));
    },
  },
];
