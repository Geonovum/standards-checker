import type { Extension } from '@uiw/react-codemirror';
import type { Diagnostic as CodemirrorDiagnostic } from '@codemirror/lint';

export type ConformanceClass = {
  name: string;
  /** The conformance-class URI; rendered as a clickable source link. */
  href?: string;
  extension: Extension;
};

export type Severity = 'hint' | 'info' | 'warning' | 'error';

export type Diagnostic = CodemirrorDiagnostic & {
  documentationUrl?: string;
};

export interface UiStrings {
  checking: string;
  noMatchingRulesets: string;
  noViolations: string;
  lintingSummary: string;
  showInEditor: string;
  documentation: string;
  severityError: string;
  severityWarning: string;
  severityInfo: string;
  severityHint: string;
}

export const DEFAULT_UI_STRINGS: UiStrings = {
  checking: 'Checking...',
  noMatchingRulesets: 'No matching rulesets found.',
  noViolations: 'No violations found.',
  lintingSummary: 'Found {total} issue(s): {errors} error(s), {warnings} warning(s), {hints} hint(s), {info} info.',
  showInEditor: 'Show in editor',
  documentation: 'Documentation',
  severityError: 'Errors',
  severityWarning: 'Warnings',
  severityInfo: 'Info',
  severityHint: 'Hints',
};

export interface UiConfig {
  title?: string;
  githubUrl?: string;
  strings?: Partial<UiStrings>;
}
