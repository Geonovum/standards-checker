import type { RulesetDefinition } from '@stoplight/spectral-core';
import { truthy } from '@stoplight/spectral-functions';
import { describe, expect, it } from 'vitest';
import type { Standard, StandardVersion } from '../standards';
import { resolveVersion } from './resolve';

const ruleset: RulesetDefinition = {
  rules: {
    'must-have-title': { given: '$', severity: 'error', then: { field: 'title', function: truthy }, message: 'needs a title' },
  },
};

const standard: Standard = { name: 'S', slug: 's', versions: [] };

const makeVersion = (overrides: Partial<StandardVersion> = {}): StandardVersion => ({
  id: '1.0',
  label: '1.0',
  status: 'final',
  example: '{}',
  rulesets: {},
  ...overrides,
});

describe('resolveVersion', () => {
  it('names each conformance class by the conformance URI and sets href to the same URI by default', () => {
    const resolved = resolveVersion(standard, makeVersion({ rulesets: { 'http://example.com/conf/core': ruleset } }));
    expect(resolved.conformanceClasses).toHaveLength(1);
    expect(resolved.conformanceClasses[0].name).toBe('http://example.com/conf/core');
    expect(resolved.conformanceClasses[0].href).toBe('http://example.com/conf/core');
  });

  it('applies sourceLabel to the display name but keeps href as the full URI', () => {
    const uri = 'http://www.opengis.net/spec/json-fg-1/1.0/conf/core';
    const resolved = resolveVersion(
      standard,
      makeVersion({ rulesets: { [uri]: ruleset }, sourceLabel: u => u.replace('http://www.opengis.net/spec/', '') }),
    );
    expect(resolved.conformanceClasses[0].name).toBe('json-fg-1/1.0/conf/core');
    expect(resolved.conformanceClasses[0].href).toBe(uri);
  });

  it('toConformanceClasses re-derives conformanceClasses (with href) for a ruleset subset', () => {
    const resolved = resolveVersion(standard, makeVersion());
    const conformanceClasses = resolved.toConformanceClasses({ 'http://x/conf/a': ruleset });
    expect(conformanceClasses).toHaveLength(1);
    expect(conformanceClasses[0].href).toBe('http://x/conf/a');
  });
});
