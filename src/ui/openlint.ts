import { linter } from '@codemirror/lint';
import type { RulesetDefinition } from '@openlint/openlint-core';
import type { Extension } from '@uiw/react-codemirror';
import { Document, OpenLint, detectEncoding } from '../encodings';
import { mapSeverity } from '../types';
import { getRangeMapper } from './encodings';

export interface Rulesets {
  [confClass: string]: RulesetDefinition;
}

export const openLintChecker = (name: string, ruleset: RulesetDefinition): Extension => {
  const openLint = new OpenLint();
  openLint.setRuleset(ruleset);

  return linter(async view => {
    const doc = view.state.doc;
    const content = doc.toString();
    const encoding = detectEncoding(content);
    const mapRange = getRangeMapper(encoding.id);

    try {
      const violations = await openLint.run(new Document(content, encoding.parser));
      return violations.map(violation => ({
        source: name,
        ...mapRange(doc, violation, content),
        severity: mapSeverity(violation.severity),
        message: `[${violation.code}] ${violation.message}`,
        documentationUrl: violation.documentationUrl,
      }));
    } catch (error) {
      // Never let a rejected run swallow the lint dispatch: @codemirror/lint only
      // emits `setDiagnosticsEffect` (which clears the `checking` flag and its
      // loading indicator) when the source resolves. Returning an empty result
      // keeps the UI responsive instead of spinning forever on a checker failure.
      console.error(`[${name}] validation failed:`, error);
      return [];
    }
  });
};

/** @deprecated Use `openLintChecker`. Removed in the next major. */
export const spectralChecker = openLintChecker;
