export type Severity = "error" | "warning" | "info";
export type ProfileName = "global" | "strict" | "commerce" | "public-sector";
export type RuleCategory =
  | "document"
  | "identity"
  | "address"
  | "contact"
  | "date-time"
  | "localization"
  | "accessibility";

export interface Location {
  line: number;
  column: number;
}

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  help: string;
  file: string;
  location: Location;
  fingerprint: string;
  category: RuleCategory;
}

export interface AuditResult {
  files: string[];
  findings: Finding[];
  score: number;
  summary: Record<Severity, number>;
}

export interface FormKindConfig {
  profile?: ProfileName;
  ignore?: string[];
  severity?: Partial<Record<string, Severity | "off">>;
  exclude?: string[];
}

export interface AnalyzeOptions {
  file?: string;
  config?: FormKindConfig;
}

export interface LoadedSource {
  name: string;
  html: string;
  syntax: "html" | "jsx" | "vue" | "svelte" | "remote";
}

export interface BaselineFile {
  version: 1;
  generatedAt: string;
  fingerprints: string[];
}
