import { describe, expect, it } from 'vitest';
import type { RulesetPlugin, ValidationResult } from '../types';
import { renderTable } from './table';

const plugin: RulesetPlugin = { id: 'test-plugin' };

const makeResult = (overrides: Partial<ValidationResult> = {}): ValidationResult => ({
  valid: true,
  diagnostics: [],
  content: '{"foo":"bar"}',
  rulesets: ['ruleset-a'],
  ...overrides,
});

describe('renderTable', () => {
  it('renders summary with no diagnostics', () => {
    const output = renderTable(plugin, makeResult());

    expect(output).toContain('Ruleset: test-plugin');
    expect(output).toContain('Applied rulesets: ruleset-a');
    expect(output).toContain('Diagnostics: 0');
    expect(output).toContain('No diagnostics.');
  });

  it('renders diagnostics grouped by severity, with path as array, without range', () => {
    const output = renderTable(
      plugin,
      makeResult({
        valid: false,
        diagnostics: [
          {
            severity: 'error',
            message: 'Missing required field',
            code: '/req/core/schema-valid',
            path: ['features', 0, 'properties', 'name'],
            range: { start: { line: 5, character: 10 }, end: { line: 5, character: 20 } },
          },
        ],
      }),
    );

    expect(output).toContain('Errors (1)');
    expect(output).toContain('1. /req/core/schema-valid');
    expect(output).toContain('message: Missing required field');
    expect(output).toContain('path: ["features",0,"properties","name"]');
    expect(output).not.toContain('range');
  });

  it('renders [] for empty path', () => {
    const output = renderTable(
      plugin,
      makeResult({
        diagnostics: [
          {
            severity: 'warning',
            message: 'Root issue',
            code: 'root-check',
            path: [],
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
          },
        ],
      }),
    );

    expect(output).toContain('path: []');
  });

  it('includes source and documentation URL when present', () => {
    const output = renderTable(
      plugin,
      makeResult({
        diagnostics: [
          {
            severity: 'info',
            message: 'Info message',
            code: 'info-rule',
            path: ['a'],
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
            source: 'custom-source',
            documentationUrl: 'https://example.com/docs',
          },
        ],
      }),
    );

    expect(output).toContain('Info (1)');
    expect(output).toContain('source: custom-source');
    expect(output).toContain('docs: https://example.com/docs');
  });

  it('counts severities correctly and groups diagnostics', () => {
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    const output = renderTable(
      plugin,
      makeResult({
        diagnostics: [
          { severity: 'error', message: 'e1', code: 'r1', path: [], range },
          { severity: 'error', message: 'e2', code: 'r2', path: [], range },
          { severity: 'warning', message: 'w1', code: 'r3', path: [], range },
          { severity: 'hint', message: 'h1', code: 'r4', path: [], range },
        ],
      }),
    );

    expect(output).toContain('Diagnostics: 4 (errors 2, warnings 1, info 0, hints 1)');
    expect(output).toContain('Errors (2)');
    expect(output).toContain('Warnings (1)');
    expect(output).toContain('Hints (1)');
    expect(output).not.toContain('Info (');

    // Verify grouping order: errors before warnings before hints
    const errorsIndex = output.indexOf('Errors (2)');
    const warningsIndex = output.indexOf('Warnings (1)');
    const hintsIndex = output.indexOf('Hints (1)');
    expect(errorsIndex).toBeLessThan(warningsIndex);
    expect(warningsIndex).toBeLessThan(hintsIndex);
  });
});
