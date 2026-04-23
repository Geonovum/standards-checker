import type { RulesetDefinition } from '@stoplight/spectral-core';
import { truthy } from '@stoplight/spectral-functions';
import { describe, expect, it } from 'vitest';
import { run } from './run';
import type { RulesetPlugin } from './types';

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

const plugin: RulesetPlugin = {
  id: 'test-plugin',
  rulesets: { 'test-plugin': ruleset },
};

describe('run() — multi-encoding input', () => {
  it('produces the same rule violation for JSON and YAML representations', async () => {
    const jsonResult = await run('{"description": "x"}', plugin, { format: 'json' });
    const yamlResult = await run('description: x\n', plugin, { format: 'json' });

    const jsonCodes = jsonResult.result.diagnostics.map(d => d.code);
    const yamlCodes = yamlResult.result.diagnostics.map(d => d.code);

    expect(jsonCodes).toContain('must-have-title');
    expect(yamlCodes).toContain('must-have-title');
    expect(jsonCodes).toEqual(yamlCodes);
  });

  it('preserves flow-style YAML content in the result', async () => {
    const result = await run('{description: x}', plugin, { format: 'json' });
    expect(result.result.content).toBe('{description: x}');
  });

  it('stringifies an object input to canonical JSON before running', async () => {
    const result = await run({ description: 'x' }, plugin, { format: 'json' });
    expect(result.result.content).toBe(JSON.stringify({ description: 'x' }, null, 2));
    expect(result.result.diagnostics.map(d => d.code)).toContain('must-have-title');
  });
});
