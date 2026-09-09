import type { ISpectralDiagnostic } from '@stoplight/spectral-core';
import { DiagnosticSeverity } from '@stoplight/types';
import { describe, expect, it } from 'vitest';
import './vitest-matchers';

const diagnostic = (code: string, message: string): ISpectralDiagnostic => ({
  code,
  message,
  path: [],
  severity: DiagnosticSeverity.Error,
  range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
});

const linkRel = diagnostic('/req/core/link-rel', 'Link is missing a rel');
const schemaValid = diagnostic('/req/core/schema-valid', 'Schema is invalid');

describe('toContainViolation', () => {
  it('matches a single violation by rule code', () => {
    expect([schemaValid]).toContainViolation('/req/core/schema-valid');
  });

  it('matches a repeated violation by count', () => {
    const violations = [schemaValid, schemaValid, linkRel];

    expect(violations).toContainViolation('/req/core/schema-valid', 2);
    expect(violations).toContainViolation('/req/core/link-rel', 1);
  });

  it('matches the violation message by string and by pattern', () => {
    expect([linkRel]).toContainViolation('/req/core/link-rel', 1, 'missing a rel');
    expect([linkRel]).toContainViolation('/req/core/link-rel', 1, /^Link/);
  });

  it('fails when the code is absent', () => {
    expect(() => expect([linkRel]).toContainViolation('/req/core/schema-valid')).toThrow();
  });

  it('fails when the count differs', () => {
    expect(() => expect([linkRel]).toContainViolation('/req/core/link-rel', 2)).toThrow();
  });

  it('fails when the message does not match', () => {
    expect(() => expect([linkRel]).toContainViolation('/req/core/link-rel', 1, /^Schema/)).toThrow();
  });
});
