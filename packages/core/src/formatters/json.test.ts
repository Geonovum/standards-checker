import { describe, expect, it } from 'vitest';
import type { ValidationResult } from '../types';
import { renderJson } from './json';

const makeResult = (overrides: Partial<ValidationResult> = {}): ValidationResult => ({
  valid: true,
  diagnostics: [],
  content: '{"foo":"bar"}',
  rulesets: ['ruleset-a'],
  ...overrides,
});

describe('renderJson', () => {
  it('excludes content from output', () => {
    const parsed = JSON.parse(renderJson(makeResult()));

    expect(parsed).not.toHaveProperty('content');
  });

  it('excludes range from diagnostics', () => {
    const diagnostic = {
      severity: 'error' as const,
      message: 'Something wrong',
      code: 'rule-1',
      path: ['a', 'b'],
      range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } },
      source: 'my-ruleset',
    };

    const parsed = JSON.parse(renderJson(makeResult({ valid: false, diagnostics: [diagnostic], rulesets: ['rs-1'] })));

    expect(parsed.valid).toBe(false);
    expect(parsed.rulesets).toEqual(['rs-1']);
    expect(parsed.diagnostics).toHaveLength(1);
    expect(parsed.diagnostics[0]).toEqual({
      severity: 'error',
      message: 'Something wrong',
      code: 'rule-1',
      path: ['a', 'b'],
      source: 'my-ruleset',
    });
    expect(parsed.diagnostics[0]).not.toHaveProperty('range');
  });

  it('produces valid JSON', () => {
    expect(() => JSON.parse(renderJson(makeResult()))).not.toThrow();
  });
});
