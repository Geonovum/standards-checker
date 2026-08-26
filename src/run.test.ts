import type { RulesetDefinition } from '@stoplight/spectral-core';
import { truthy } from '@stoplight/spectral-functions';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

describe('run() — diagnostic attribution', () => {
  it('records the ruleset that flagged each diagnostic', async () => {
    const result = await run('{"description": "x"}', plugin, { format: 'json' });
    expect(result.result.diagnostics.map(d => d.ruleset)).toEqual(['test-plugin']);
  });

  // Checkers with several conformance classes rely on this to tell which one
  // flagged a diagnostic; the document source is the same for all of them.
  it('attributes each diagnostic to its own conformance class', async () => {
    const multi: RulesetPlugin = {
      id: 'multi-plugin',
      rulesets: {
        'https://example.test/conf/core': ruleset,
        'https://example.test/conf/extras': {
          rules: {
            'must-have-summary': {
              given: '$',
              severity: 'warn',
              then: { field: 'summary', function: truthy },
              message: 'Document must have a summary.',
            },
          },
        },
      },
    };

    const result = await run('{"description": "x"}', multi, { format: 'json' });

    expect(result.result.diagnostics.map(d => [d.code, d.ruleset])).toEqual([
      ['must-have-title', 'https://example.test/conf/core'],
      ['must-have-summary', 'https://example.test/conf/extras'],
    ]);
  });

  it('leaves source unset when the input has no location', async () => {
    const result = await run('{"description": "x"}', plugin, { format: 'json' });
    expect(result.result.diagnostics[0].source).toBeUndefined();
  });
});

const CONF_CLASS = 'https://example.test/spec/1.0/conf/core';

const refPlugin: RulesetPlugin = {
  id: 'ref-plugin',
  rulesets: {
    [CONF_CLASS]: {
      rules: {
        'schema-must-have-type': {
          given: '$.components.schemas.Problem',
          severity: 'error',
          then: { field: 'type', function: truthy },
          message: 'Schema must declare a type.',
        },
      },
    },
  },
};

// Spectral only resolves external `$ref`s relative to the document when the
// document carries a source; without one it falls back to the process CWD, which
// is why a sibling schema next to the input file used to fail with ENOENT.
describe('run() — external $ref resolution', () => {
  let dir: string;
  let spec: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'standards-checker-refs-'));
    spec = join(dir, 'spec.json');

    writeFileSync(join(dir, 'problem.json'), JSON.stringify({ type: 'object' }));
    writeFileSync(join(dir, 'untyped.json'), JSON.stringify({ description: 'no type here' }));
    writeFileSync(spec, JSON.stringify({ components: { schemas: { Problem: { $ref: './problem.json' } } } }));
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('resolves a sibling $ref against the source instead of the process CWD', async () => {
    const content = JSON.stringify({ components: { schemas: { Problem: { $ref: './problem.json' } } } });
    const result = await run(content, refPlugin, { format: 'json', source: spec });

    expect(result.result.diagnostics).toEqual([]);
    expect(result.exitCode).toBe(0);
  });

  it('reports invalid-ref for the same document without a source', async () => {
    const content = JSON.stringify({ components: { schemas: { Problem: { $ref: './problem.json' } } } });
    const result = await run(content, refPlugin, { format: 'json' });

    expect(result.result.diagnostics.map(d => d.code)).toContain('invalid-ref');
  });

  it('attributes a violation inside a referenced document to that file', async () => {
    const content = JSON.stringify({ components: { schemas: { Problem: { $ref: './untyped.json' } } } });
    const result = await run(content, refPlugin, { format: 'json', source: spec });

    expect(result.result.diagnostics).toHaveLength(1);
    expect(result.result.diagnostics[0]).toMatchObject({
      code: 'schema-must-have-type',
      source: join(dir, 'untyped.json'),
      ruleset: CONF_CLASS,
    });
  });
});
