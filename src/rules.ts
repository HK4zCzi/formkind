import type { DefaultTreeAdapterMap } from "parse5";
import type { Finding, RuleCategory, Severity } from "./types.js";

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
  category: RuleCategory;
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

function fieldMatches(element: Element, context: RuleContext, pattern: RegExp): boolean {
  return pattern.test(fieldIdentity(element, context.labels));
}

function optionCount(element: Element): number {
  if (!("childNodes" in element)) return 0;
  return element.childNodes.filter(
    (child): child is Element => "tagName" in child && child.tagName === "option",
  ).length;
}

export const rules: Rule[] = [
  {
    id: "FK001",
    category: "document",
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
    category: "identity",
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
    category: "identity",
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
    category: "contact",
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
    category: "contact",
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
    category: "address",
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
    category: "date-time",
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
    category: "accessibility",
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
    category: "address",
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
  {
    id: "FK010",
    category: "address",
    severity: "error",
    description: "Postal codes use text fields",
    help: "Use type=text and an appropriate autocomplete token. Postal codes can start with zero and contain letters, spaces, or hyphens.",
    check(context) {
      return inputElements(context)
        .filter((element) => fieldMatches(element, context, /\b(postal|postcode|zip)\b/))
        .filter((element) => ["number", "tel"].includes(getAttribute(element, "type") ?? ""))
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK011",
    category: "contact",
    severity: "warning",
    description: "Phone numbers use telephone fields",
    help: "Use type=tel instead of number. Telephone identifiers are not quantities and may contain a leading plus sign or formatting characters.",
    check(context) {
      return inputElements(context)
        .filter((element) => fieldMatches(element, context, /\b(phone|telephone|mobile|tel)\b/))
        .filter((element) => getAttribute(element, "type") === "number")
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK012",
    category: "address",
    severity: "warning",
    description: "Address fields allow long international addresses",
    help: "Allow at least 100 characters for street and delivery-address fields; international formats vary substantially.",
    check(context) {
      return inputElements(context)
        .filter((element) => fieldMatches(element, context, /\b(address|street)\b/))
        .filter((element) => Number(getAttribute(element, "maxlength")) > 0)
        .filter((element) => Number(getAttribute(element, "maxlength")) < 100)
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK013",
    category: "address",
    severity: "error",
    description: "Secondary address lines are optional",
    help: "Do not require apartment, suite, unit, building, or address-line2; these concepts do not apply to every address.",
    check(context) {
      return inputElements(context)
        .filter((element) => hasAttribute(element, "required"))
        .filter((element) =>
          fieldMatches(element, context, /\b(address.?2|line.?2|apartment|suite|unit|building)\b/),
        )
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK014",
    category: "identity",
    severity: "error",
    description: "Middle names are optional",
    help: "Do not require a middle name or initial. Many people do not have one, while other naming systems do not use this structure.",
    check(context) {
      return inputElements(context)
        .filter((element) => hasAttribute(element, "required"))
        .filter((element) => fieldMatches(element, context, /\bmiddle([\s_-]?(name|initial))?\b/))
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK015",
    category: "identity",
    severity: "warning",
    description: "Honorifics and titles are optional",
    help: "Do not require title, salutation, honorific, Mr, Ms, or Mrs. Legal and cultural conventions vary.",
    check(context) {
      return context.elements
        .filter((element) => element.tagName === "input" || element.tagName === "select")
        .filter((element) => hasAttribute(element, "required"))
        .filter((element) => fieldMatches(element, context, /\b(title|salutation|honorific)\b/))
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK016",
    category: "identity",
    severity: "warning",
    description: "Gender fields are not forced into a binary choice",
    help: "When gender is genuinely required, explain why and provide inclusive choices plus self-description or prefer-not-to-say options.",
    check(context) {
      return context.elements
        .filter((element) => element.tagName === "select")
        .filter((element) => hasAttribute(element, "required"))
        .filter((element) => fieldMatches(element, context, /\b(gender|sex)\b/))
        .filter((element) => optionCount(element) > 0 && optionCount(element) <= 3)
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK017",
    category: "address",
    severity: "warning",
    description: "Country selectors are not tiny hard-coded lists",
    help: "Use a maintained country/territory data source or clearly state regional availability. A short static list often excludes valid users silently.",
    check(context) {
      return context.elements
        .filter((element) => element.tagName === "select")
        .filter((element) => hasAttribute(element, "required"))
        .filter((element) => fieldMatches(element, context, /\bcountry\b/))
        .filter((element) => optionCount(element) > 1 && optionCount(element) < 20)
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK018",
    category: "document",
    severity: "warning",
    description: "Right-to-left documents declare direction",
    help: "Set dir=rtl for Arabic, Hebrew, Persian, Urdu, and other RTL documents, or manage direction dynamically at the correct container.",
    check(context) {
      const html = context.elements.find((element) => element.tagName === "html");
      if (!html) return [];
      const lang = getAttribute(html, "lang")?.toLowerCase() ?? "";
      const rtl = /^(ar|fa|he|iw|ps|ur|yi)(-|$)/.test(lang);
      return rtl && getAttribute(html, "dir") !== "rtl" ? [context.finding(this, html)] : [];
    },
  },
  {
    id: "FK019",
    category: "document",
    severity: "warning",
    description: "Language tags use BCP 47 style",
    help: "Use language tags such as en-US or pt-BR, not underscore forms such as en_US.",
    check(context) {
      const html = context.elements.find((element) => element.tagName === "html");
      return html && (getAttribute(html, "lang") ?? "").includes("_")
        ? [context.finding(this, html)]
        : [];
    },
  },
  {
    id: "FK020",
    category: "date-time",
    severity: "warning",
    description: "Local date-time fields provide timezone context",
    help: "A datetime-local value has no timezone. Display the assumed zone or collect an IANA timezone when the instant matters.",
    check(context) {
      const hasTimezone = context.elements.some((element) =>
        fieldMatches(element, context, /\b(time.?zone|timezone|tz)\b/),
      );
      if (hasTimezone) return [];
      return inputElements(context)
        .filter((element) => getAttribute(element, "type") === "datetime-local")
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK021",
    category: "localization",
    severity: "warning",
    description: "Whole pages are not excluded from translation",
    help: "Avoid translate=no on html or body. Apply it only to brand names, identifiers, code, or other intentionally invariant fragments.",
    check(context) {
      return context.elements
        .filter((element) => element.tagName === "html" || element.tagName === "body")
        .filter((element) => getAttribute(element, "translate") === "no")
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK022",
    category: "contact",
    severity: "warning",
    description: "Email fields use email semantics",
    help: "Use type=email and autocomplete=email for email fields so keyboards, autofill, and validation can adapt.",
    check(context) {
      return inputElements(context)
        .filter((element) => fieldMatches(element, context, /\be-?mail\b/))
        .filter((element) => (getAttribute(element, "type") ?? "text") !== "email")
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK023",
    category: "accessibility",
    severity: "info",
    description: "Form controls have persistent labels",
    help: "Use a label, aria-label, or aria-labelledby. Placeholder text disappears during entry and is difficult to translate as a label substitute.",
    check(context) {
      return context.elements
        .filter(
          (element) =>
            element.tagName === "input" ||
            element.tagName === "select" ||
            element.tagName === "textarea",
        )
        .filter((element) => getAttribute(element, "type") !== "hidden")
        .filter((element) => {
          const id = getAttribute(element, "id");
          return (
            !getAttribute(element, "aria-label") &&
            !getAttribute(element, "aria-labelledby") &&
            !(id && context.labels.has(id))
          );
        })
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK024",
    category: "localization",
    severity: "warning",
    description: "Decimal fields do not assume whole numbers",
    help: "For amount, price, weight, or measurement fields, use step=any or an appropriate decimal step and localize presentation separately.",
    check(context) {
      return inputElements(context)
        .filter((element) => getAttribute(element, "type") === "number")
        .filter((element) =>
          fieldMatches(element, context, /\b(amount|price|weight|height|width|length|rate)\b/),
        )
        .filter((element) => {
          const step = getAttribute(element, "step");
          return !step || step === "1";
        })
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK025",
    category: "identity",
    severity: "warning",
    description: "Required split names allow mononyms",
    help: "People may have a single legal name. Provide a full-name path or make family-name optional when both given and family names are collected.",
    check(context) {
      const requiredGiven = inputElements(context).find(
        (element) =>
          hasAttribute(element, "required") &&
          fieldMatches(element, context, /\b(given.?name|first.?name)\b/),
      );
      const requiredFamily = inputElements(context).find(
        (element) =>
          hasAttribute(element, "required") &&
          fieldMatches(element, context, /\b(family.?name|last.?name|surname)\b/),
      );
      const fullName = inputElements(context).some((element) =>
        fieldMatches(element, context, /\bfull.?name\b/),
      );
      return requiredGiven && requiredFamily && !fullName
        ? [context.finding(this, requiredFamily)]
        : [];
    },
  },
  {
    id: "FK026",
    category: "contact",
    severity: "warning",
    description: "Telephone examples do not imply one country",
    help: "Use an international example or adapt examples after country selection; fixed +1 or (555) placeholders imply North America.",
    check(context) {
      return inputElements(context)
        .filter((element) => getAttribute(element, "type") === "tel")
        .filter((element) =>
          /(?:\+?1[\s.-]|\(555\))/.test(getAttribute(element, "placeholder") ?? ""),
        )
        .map((element) => context.finding(this, element));
    },
  },
  {
    id: "FK027",
    category: "address",
    severity: "error",
    description: "Postal patterns are not fixed to five digits",
    help: "Do not enforce a US-style five-digit pattern globally. Validate postal codes after the user selects a country.",
    check(context) {
      return inputElements(context)
        .filter((element) => fieldMatches(element, context, /\b(postal|postcode|zip)\b/))
        .filter((element) => /(?:\\d|\[0-9\])\{5\}/.test(getAttribute(element, "pattern") ?? ""))
        .map((element) => context.finding(this, element));
    },
  },
];
