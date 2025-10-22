import type { Extension } from '@uiw/react-codemirror';
import type { Diagnostic as CodemirrorDiagnostic } from '@codemirror/lint';

export interface Spec {
  name: string;
  slug: string;
  example: string;
  linters: SpecLinter[];
  responseMapper?: SpecResponseMapper;
  strings?: Partial<SpecStrings>;
}

export interface SpecInput {
  content: string;
  linters?: SpecLinter[];
}

export type SpecLinter = {
  name: string;
  linter: Extension;
};

export type SpecResponseMapper = (responseText: string) => Promise<SpecInput>;

export type Severity = 'hint' | 'info' | 'warning' | 'error';

export type Diagnostic = CodemirrorDiagnostic & {
  documentationUrl?: string;
};

export interface SpecStrings {
  checking: string;
  noMatchingRulesets: string;
  noViolations: string;
  lintingErrorsSummary: string;
  showInEditor: string;
  documentation: string;
}

export const DEFAULT_SPEC_STRINGS: SpecStrings = {
  checking: 'Checking...',
  noMatchingRulesets: 'No matching rulesets found.',
  noViolations: 'No violations found.',
  lintingErrorsSummary: 'Found {count} linting error(s).',
  showInEditor: 'Show in editor',
  documentation: 'Documentation',
};
