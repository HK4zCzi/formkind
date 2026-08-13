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

type AgentGoal = "assess" | "plan" | "review";
type AgentRisk = "low" | "medium" | "high";
type AgentPriority = "now" | "next" | "later";
interface SourceExcerpt {
    file: string;
    startLine: number;
    endLine: number;
    content: string;
}
interface SpecialistFinding {
    fingerprint: string;
    risk: AgentRisk;
    whyItMatters: string;
    remediation: string;
    acceptanceCriteria: string[];
    patchHint: string;
}
interface SpecialistReport {
    category: RuleCategory;
    summary: string;
    findings: SpecialistFinding[];
    marketChecks: string[];
    blockers: string[];
}
interface AgentWorkstream {
    title: string;
    priority: AgentPriority;
    owner: string;
    findingFingerprints: string[];
    steps: string[];
    validation: string[];
}
interface AgentPlan {
    version: 1;
    generatedAt: string;
    provider: string;
    model: string;
    goal: AgentGoal;
    auditScore: number;
    analyzedFindings: number;
    summary: string;
    strategy: string;
    workstreams: AgentWorkstream[];
    risks: string[];
    nextActions: string[];
    pullRequestBody: string;
    specialistReports: SpecialistReport[];
    requiresHumanReview: true;
}
interface SpecialistRequest {
    goal: AgentGoal;
    markets: string[];
    category: RuleCategory;
    findings: Finding[];
    excerpts: SourceExcerpt[];
}
interface SynthesisRequest {
    goal: AgentGoal;
    markets: string[];
    audit: AuditResult;
    reports: SpecialistReport[];
}
interface AgentProvider {
    readonly name: string;
    readonly model: string;
    analyzeSpecialist(request: SpecialistRequest): Promise<SpecialistReport>;
    synthesize(request: SynthesisRequest): Promise<Omit<AgentPlan, "version" | "generatedAt" | "provider" | "model" | "goal" | "auditScore" | "analyzedFindings" | "specialistReports" | "requiresHumanReview">>;
}
interface RunAgentOptions {
    audit: AuditResult;
    sources: LoadedSource[];
    provider: AgentProvider;
    goal?: AgentGoal;
    markets?: string[];
    maxFindings?: number;
    maxSpecialists?: number;
}

declare function runRemediationAgent(options: RunAgentOptions): Promise<AgentPlan>;

interface OpenAIProviderOptions {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    fetch?: typeof fetch;
}
declare class OpenAIResponsesProvider implements AgentProvider {
    readonly name = "openai-responses";
    readonly model: string;
    private readonly apiKey;
    private readonly baseUrl;
    private readonly request;
    constructor(options?: OpenAIProviderOptions);
    private structured;
    analyzeSpecialist(request: SpecialistRequest): Promise<SpecialistReport>;
    synthesize(request: SynthesisRequest): Promise<ReturnType<AgentProvider["synthesize"]> extends Promise<infer T> ? T : never>;
}
declare class OfflineAgentProvider implements AgentProvider {
    readonly name = "offline-planner";
    readonly model = "deterministic";
    analyzeSpecialist(request: SpecialistRequest): Promise<SpecialistReport>;
    synthesize(request: SynthesisRequest): Promise<Omit<AgentPlan, "version" | "generatedAt" | "provider" | "model" | "goal" | "auditScore" | "analyzedFindings" | "specialistReports" | "requiresHumanReview">>;
}

type AgentFormat = "json" | "markdown";
declare function reportAgentPlan(plan: AgentPlan, format: AgentFormat): string;

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

export { type AgentFormat, type AgentGoal, type AgentPlan, type AgentPriority, type AgentProvider, type AgentRisk, type AgentWorkstream, type AnalyzeOptions, type AuditResult, type BaselineFile, type Finding, type FormKindConfig, type Format, type LoadedSource, type Location, OfflineAgentProvider, OpenAIResponsesProvider, type ProfileName, type RuleCategory, type RunAgentOptions, type Severity, type SourceExcerpt, type SpecialistFinding, type SpecialistReport, type SpecialistRequest, type SynthesisRequest, analyzeHtml, applyProfile, combineResults, loadBaseline, loadConfig, loadInput, profileNames, report, reportAgentPlan, rules, runRemediationAgent, withoutBaseline, writeBaseline };
