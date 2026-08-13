export type Severity = "error" | "warning" | "info";

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
}

export interface AuditResult {
  files: string[];
  findings: Finding[];
  score: number;
  summary: Record<Severity, number>;
}

export interface FormKindConfig {
  ignore?: string[];
  severity?: Partial<Record<string, Severity | "off">>;
}

export interface AnalyzeOptions {
  file?: string;
  config?: FormKindConfig;
}

export interface LoadedSource {
  name: string;
  html: string;
}
