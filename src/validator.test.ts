import type { RulesetDefinition } from '@stoplight/spectral-core';
import { truthy } from '@stoplight/spectral-functions';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatJson, validate, validateUrl } from './validator';

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

describe('formatJson()', () => {
  it('pretty-prints valid JSON', () => {
    expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it('throws on invalid JSON, even if the input parses as YAML', () => {
    // Guards the historical public-API contract: callers rely on the throw.
    expect(() => formatJson('a: 1\n')).toThrow(/Invalid JSON/);
  });

  it('throws on entirely unparseable input', () => {
    expect(() => formatJson('::: not valid :::')).toThrow(/Invalid JSON/);
  });
});

describe('validateUrl()', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('advertises YAML acceptance in the request headers', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('title: ok\n', { status: 200 }));
    globalThis.fetch = fetchMock;

    await validateUrl({ url: 'https://example.test/spec', rulesets: { r: ruleset } });

    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0][1];
    const accept = (init?.headers as Record<string, string>).Accept;
    expect(accept).toContain('application/json');
    expect(accept).toContain('application/yaml');
    expect(accept).toContain('text/yaml');
  });

  it('allows the caller to override the Accept header', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('{"title":"ok"}', { status: 200 }));
    globalThis.fetch = fetchMock;

    await validateUrl({
      url: 'https://example.test/spec',
      rulesets: { r: ruleset },
      headers: { Accept: 'application/vnd.custom+json' },
    });

    const init = fetchMock.mock.calls[0][1];
    expect((init?.headers as Record<string, string>).Accept).toBe('application/vnd.custom+json');
  });
});
