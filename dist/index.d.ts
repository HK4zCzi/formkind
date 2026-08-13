import { DefaultTreeAdapterMap } from 'parse5';

type Severity = "error" | "warning" | "info";
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
}
interface AuditResult {
    files: string[];
    findings: Finding[];
    score: number;
    summary: Record<Severity, number>;
}
interface FormKindConfig {
    ignore?: string[];
    severity?: Partial<Record<string, Severity | "off">>;
}
interface AnalyzeOptions {
    file?: string;
    config?: FormKindConfig;
}
interface LoadedSource {
    name: string;
    html: string;
}

declare function analyzeHtml(html: string, options?: AnalyzeOptions): AuditResult;
declare function combineResults(results: AuditResult[]): AuditResult;

declare function loadConfig(path?: string): Promise<FormKindConfig>;

declare function loadInput(input: string, maxBytes?: number): Promise<LoadedSource[]>;

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
    severity: Severity;
    description: string;
    help: string;
    check: (context: RuleContext) => Finding[];
}
declare const rules: Rule[];

export { type AnalyzeOptions, type AuditResult, type Finding, type FormKindConfig, type Format, type LoadedSource, type Location, type Severity, analyzeHtml, combineResults, loadConfig, loadInput, report, rules };
