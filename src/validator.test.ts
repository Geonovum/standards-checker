import type { RulesetDefinition } from '@stoplight/spectral-core';
import { truthy } from '@stoplight/spectral-functions';
import { describe, expect, it } from 'vitest';
import { validate } from './validator';

const ruleset: RulesetDefinition = {
  rules: {
    'must-have-title': {
      given: '$',
      severity: 'error',
      then: { field: 'title', function: truthy },
      message: 'Document must have a title.',
    },
  },
};

describe('validate() — multi-encoding input', () => {
  it('accepts a JSON document and reports rule violations', async () => {
    const result = await validate({ content: '{"description": "no title here"}', rulesets: { r: ruleset } });
    expect(result.valid).toBe(false);
    expect(result.diagnostics.map(d => d.code)).toContain('must-have-title');
  });

  it('accepts an equivalent YAML document and reports the same rule violations', async () => {
    const result = await validate({ content: 'description: no title here\n', rulesets: { r: ruleset } });
    expect(result.valid).toBe(false);
    expect(result.diagnostics.map(d => d.code)).toContain('must-have-title');
  });

  it('accepts flow-style YAML that is not valid JSON', async () => {
    const result = await validate({ content: '{description: no title here}', rulesets: { r: ruleset } });
    expect(result.valid).toBe(false);
    expect(result.diagnostics.map(d => d.code)).toContain('must-have-title');
  });

  it('marks a compliant JSON document as valid', async () => {
    const result = await validate({ content: '{"title": "ok"}', rulesets: { r: ruleset } });
    expect(result.valid).toBe(true);
  });

  it('marks a compliant YAML document as valid', async () => {
    const result = await validate({ content: 'title: ok\n', rulesets: { r: ruleset } });
    expect(result.valid).toBe(true);
  });
});
