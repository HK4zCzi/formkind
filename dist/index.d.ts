import { DefaultTreeAdapterMap } from 'parse5';

type Severity = "error" | "warning" | "info";
type ProfileName = "global" | "strict" | "commerce" | "public-sector";
type RuleCategory = "document" | "identity" | "address" | "contact" | "date-time" | "localization" | "accessibility";
interface Location {
    line: number;
    column: number;
}
interface Finding {
    ruleId: string;
    severity: Severity;
    message: string;
    help: string;
    file: string;
    location: Location;
    fingerprint: string;
    category: RuleCategory;
}
interface AuditResult {
    files: string[];
    findings: Finding[];
    score: number;
    summary: Record<Severity, number>;
}
interface FormKindConfig {
    profile?: ProfileName;
    ignore?: string[];
    severity?: Partial<Record<string, Severity | "off">>;
    exclude?: string[];
}
interface AnalyzeOptions {
    file?: string;
    config?: FormKindConfig;
}
interface LoadedSource {
    name: string;
    html: string;
    syntax: "html" | "jsx" | "vue" | "svelte" | "remote";
}
interface BaselineFile {
    version: 1;
    generatedAt: string;
    fingerprints: string[];
}

declare function analyzeHtml(html: string, options?: AnalyzeOptions): AuditResult;
declare function combineResults(results: AuditResult[]): AuditResult;

declare function writeBaseline(path: string, result: AuditResult): Promise<BaselineFile>;
declare function loadBaseline(path: string): Promise<BaselineFile>;
declare function withoutBaseline(result: AuditResult, baseline: BaselineFile): AuditResult;

declare function loadConfig(path?: string): Promise<FormKindConfig>;

declare function loadInput(input: string, maxBytes?: number): Promise<LoadedSource[]>;

declare function applyProfile(config: FormKindConfig): FormKindConfig;
declare const profileNames: ProfileName[];

type Format = "pretty" | "json" | "markdown" | "sarif";
declare function report(result: AuditResult, format: Format): string;

type Element = DefaultTreeAdapterMap["element"];
interface RuleContext {
    file: string;
    elements: Element[];
    labels: Map<string, string>;
    finding: (rule: Rule, element: Element, message?: string) => Finding;
}
interface Rule {
    id: string;
    category: RuleCategory;
    severity: Severity;
    description: string;
    help: string;
    check: (context: RuleContext) => Finding[];
}
declare const rules: Rule[];

export { type AnalyzeOptions, type AuditResult, type BaselineFile, type Finding, type FormKindConfig, type Format, type LoadedSource, type Location, type ProfileName, type RuleCategory, type Severity, analyzeHtml, applyProfile, combineResults, loadBaseline, loadConfig, loadInput, profileNames, report, rules, withoutBaseline, writeBaseline };
