import type { AuditResult, Finding, LoadedSource, RuleCategory } from "../types.js";

export type AgentGoal = "assess" | "plan" | "review";
export type AgentRisk = "low" | "medium" | "high";
export type AgentPriority = "now" | "next" | "later";

export interface SourceExcerpt {
  file: string;
  startLine: number;
  endLine: number;
  content: string;
}

export interface SpecialistFinding {
  fingerprint: string;
  risk: AgentRisk;
  whyItMatters: string;
  remediation: string;
  acceptanceCriteria: string[];
  patchHint: string;
}

export interface SpecialistReport {
  category: RuleCategory;
  summary: string;
  findings: SpecialistFinding[];
  marketChecks: string[];
  blockers: string[];
}

export interface AgentWorkstream {
  title: string;
  priority: AgentPriority;
  owner: string;
  findingFingerprints: string[];
  steps: string[];
  validation: string[];
}

export interface AgentPlan {
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

export interface SpecialistRequest {
  goal: AgentGoal;
  markets: string[];
  category: RuleCategory;
  findings: Finding[];
  excerpts: SourceExcerpt[];
}

export interface SynthesisRequest {
  goal: AgentGoal;
  markets: string[];
  audit: AuditResult;
  reports: SpecialistReport[];
}

export interface AgentProvider {
  readonly name: string;
  readonly model: string;
  analyzeSpecialist(request: SpecialistRequest): Promise<SpecialistReport>;
  synthesize(request: SynthesisRequest): Promise<Omit<AgentPlan, "version" | "generatedAt" | "provider" | "model" | "goal" | "auditScore" | "analyzedFindings" | "specialistReports" | "requiresHumanReview">>;
}

export interface RunAgentOptions {
  audit: AuditResult;
  sources: LoadedSource[];
  provider: AgentProvider;
  goal?: AgentGoal;
  markets?: string[];
  maxFindings?: number;
  maxSpecialists?: number;
}
