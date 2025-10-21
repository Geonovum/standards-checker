import type { RulesetDefinition } from '@stoplight/spectral-core';
import type { DiagnosticSeverity } from '@stoplight/types';

/**
 * Validation result from the engine
 */
export interface ValidationResult {
  /** Whether the validation passed (no errors) */
  valid: boolean;
  /** List of diagnostics (errors, warnings, info) */
  diagnostics: ValidationDiagnostic[];
  /** Original content that was validated */
  content: string;
  /** Rulesets that were applied */
  rulesets: string[];
}

/**
 * A single diagnostic from validation
 */
export interface ValidationDiagnostic {
  /** Severity level */
  severity: 'error' | 'warning' | 'info' | 'hint';
  /** Diagnostic message */
  message: string;
  /** Rule code that triggered this diagnostic */
  code: string;
  /** Path in the document where the issue was found */
  path: (string | number)[];
  /** Line and character range */
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  /** Optional documentation URL */
  documentationUrl?: string;
  /** Source ruleset name */
  source?: string;
}

/**
 * Options for validation
 */
export interface ValidateOptions {
  /** JSON content to validate */
  content: string;
  /** Rulesets to apply */
  rulesets: Record<string, RulesetDefinition>;
  /** Optional ruleset names to filter (if not provided, all rulesets are used) */
  rulesetNames?: string[];
}

/**
 * Options for validating a URL
 */
export interface ValidateUrlOptions {
  /** URL to fetch and validate */
  url: string;
  /** Rulesets to apply */
  rulesets: Record<string, RulesetDefinition>;
  /** Optional ruleset names to filter */
  rulesetNames?: string[];
  /** Optional headers for the fetch request */
  headers?: Record<string, string>;
}

/**
 * Spec definition for UI and CLI
 */
export interface Spec {
  /** Display name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Example JSON content */
  example: string;
  /** Available rulesets */
  rulesets: Record<string, RulesetDefinition>;
  /** Optional response mapper for URL validation */
  responseMapper?: (responseText: string) => Promise<{ content: string; rulesets?: Record<string, RulesetDefinition> }>;
}

/**
 * Plugin definition for the CLI runner
 */
export interface RulesetPlugin {
  /** Identifier for the plugin */
  id: string;
  /** Collection of rule definitions */
  rules?: RulesetDefinition | RulesetDefinition[];
  /** Optional map of rule sets keyed by identifier */
  rulesets?: Record<string, RulesetDefinition>;
  /** Custom spectral functions */
  funcs?: Record<string, unknown>;
  /** Optional preprocessing hook */
  preprocess?: (doc: unknown, ctx: RunContext) => unknown | Promise<unknown>;
  /** Optional postprocessing hook */
  postprocess?: (result: ValidationResult, ctx: RunContext) => ValidationResult | Promise<ValidationResult | void> | void;
}

export type RulesetPluginIndex = Record<string, RulesetPlugin>;

export type RunFormat = 'table' | 'json' | 'sarif' | 'junit';

export type FailLevel = 'none' | 'warn' | 'error';

export interface RunOptions {
  format?: RunFormat | string;
  failOn?: FailLevel | string;
}

export interface RunResult {
  exitCode: number;
  output: string;
  result: ValidationResult;
}

export interface RunContext {
  plugin: RulesetPlugin;
}

/**
 * Map DiagnosticSeverity to string
 */
export const mapSeverity = (severity: DiagnosticSeverity): 'error' | 'warning' | 'info' | 'hint' => {
  switch (severity) {
    case 1: // DiagnosticSeverity.Warning
      return 'warning';
    case 2: // DiagnosticSeverity.Information
      return 'info';
    case 3: // DiagnosticSeverity.Hint
      return 'hint';
    default:
      return 'error';
  }
};
