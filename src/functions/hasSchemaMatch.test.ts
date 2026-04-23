import type { RulesetFunctionContext } from '@stoplight/spectral-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import hasSchemaMatch from './hasSchemaMatch';

const SCHEMA_URI = 'https://example.test/schema.yaml';

const TRIVIAL_SCHEMA = `
type: object
properties:
  name:
    type: string
`;

const fakeContext = (): RulesetFunctionContext =>
  ({
    path: ['paths', '/x', 'get', 'responses', '200'],
    document: {} as never,
    documentInventory: {} as never,
    rule: {} as never,
  }) as unknown as RulesetFunctionContext;

const responseInput = (schema: object) => ({
  content: {
    'application/json': { schema },
  },
});

describe('hasSchemaMatch', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => new Response(TRIVIAL_SCHEMA, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('dedupes concurrent fetches for the same schemaUri', async () => {
    const uri = `${SCHEMA_URI}?case=dedupe`;
    const input = responseInput({ type: 'object', properties: { name: { type: 'string' } } });

    const [a, b, c] = await Promise.all([
      hasSchemaMatch(input, { schemaUri: uri }, fakeContext()),
      hasSchemaMatch(input, { schemaUri: uri }, fakeContext()),
      hasSchemaMatch(input, { schemaUri: uri }, fakeContext()),
    ]);

    expect(a).toBeUndefined();
    expect(b).toBeUndefined();
    expect(c).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries after a failed fetch instead of caching the failure', async () => {
    const uri = `${SCHEMA_URI}?case=retry`;
    const input = responseInput({ type: 'object', properties: { name: { type: 'string' } } });

    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }));

    const failure = await hasSchemaMatch(input, { schemaUri: uri }, fakeContext());
    expect(failure).toEqual([expect.objectContaining({ message: expect.stringContaining('Could not load reference schema') })]);

    const success = await hasSchemaMatch(input, { schemaUri: uri }, fakeContext());
    expect(success).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports an error when the fetch itself rejects', async () => {
    const uri = `${SCHEMA_URI}?case=network`;
    const input = responseInput({ type: 'object', properties: { name: { type: 'string' } } });

    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const result = await hasSchemaMatch(input, { schemaUri: uri }, fakeContext());

    expect(result).toEqual([expect.objectContaining({ message: expect.stringContaining('network down') })]);
  });
});
