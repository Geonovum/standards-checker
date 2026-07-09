import { linter } from '@codemirror/lint';
import type { RulesetDefinition } from '@stoplight/spectral-core';
import type { Extension } from '@uiw/react-codemirror';
import { Document, Spectral, detectEncoding } from '../encodings';
import { mapSeverity } from '../types';
import { getRangeMapper } from './encodings';

export interface Rulesets {
  [confClass: string]: RulesetDefinition;
}

export const spectralChecker = (name: string, ruleset: RulesetDefinition): Extension => {
  const spectral = new Spectral();
  spectral.setRuleset(ruleset);

  return linter(async view => {
    const doc = view.state.doc;
    const content = doc.toString();
    const encoding = detectEncoding(content);
    const mapRange = getRangeMapper(encoding.id);

    try {
      const violations = await spectral.run(new Document(content, encoding.parser));
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
