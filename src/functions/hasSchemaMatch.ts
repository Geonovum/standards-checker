import { resolveHttp } from '@stoplight/json-ref-readers';
import { extname } from '@stoplight/path';
import type { RulesetFunction } from '@stoplight/spectral-core';
import * as Parsers from '@stoplight/spectral-parsers';
import { Resolver } from '@stoplight/spectral-ref-resolver';
import { APPLICATION_JSON_TYPE } from '../constants';
import type { OpenAPIV3_0 } from '../openapi-types';
import { errorMessage, matchSchema } from '../util';

type SpectralParsersModule = typeof import('@stoplight/spectral-parsers');

const parsers = (Parsers as unknown as { default?: SpectralParsersModule }).default ?? (Parsers as unknown as SpectralParsersModule);
const { Json, Yaml } = parsers;

export interface Options {
  schema?: OpenAPIV3_0.SchemaObject;
  schemaUri?: string;
  mediaType?: string;
}

const RESOLVE_TIMEOUT_MS = 5_000;

const resolver = new Resolver({
  resolvers: {
    http: { resolve: resolveHttp },
    https: { resolve: resolveHttp },
  },
  parseResolveResult: (opts: { targetAuthority: { href(): string }; result: string }) => {
    const source = opts.targetAuthority.href().replace(/\/$/, '');
    const parser = extname(source) === '.json' ? Json : Yaml;
    const parseResult = parser.parse(opts.result);

    return Promise.resolve({
      result: parseResult.data,
    });
  },
});

// Dedupe by URI: concurrent calls for the same schemaUri share one fetch + resolve.
// A failed/timed-out resolve is evicted so a later call can retry.
const refSchemaCache = new Map<string, Promise<OpenAPIV3_0.SchemaObject>>();

const fetchAndResolveSchema = async (schemaUri: string): Promise<OpenAPIV3_0.SchemaObject> => {
  const response = await fetch(schemaUri);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${schemaUri}: HTTP ${response.status}`);
  }
  const responseText = await response.text();
  const parsed = Yaml.parse(responseText).data as OpenAPIV3_0.SchemaObject;

  const resolveResult = await Promise.race([
    resolver.resolve(parsed, { baseUri: schemaUri }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out resolving $refs in ${schemaUri} after ${RESOLVE_TIMEOUT_MS}ms`)), RESOLVE_TIMEOUT_MS),
    ),
  ]);

  return (resolveResult as { result: unknown }).result as OpenAPIV3_0.SchemaObject;
};

const getRefSchema = (schemaUri: string): Promise<OpenAPIV3_0.SchemaObject> => {
  let pending = refSchemaCache.get(schemaUri);
  if (!pending) {
    pending = fetchAndResolveSchema(schemaUri).catch(err => {
      refSchemaCache.delete(schemaUri);
      throw err;
    });
    refSchemaCache.set(schemaUri, pending);
  }
  return pending;
};

const hasSchemaMatch: RulesetFunction<OpenAPIV3_0.ResponseObject | OpenAPIV3_0.RequestBodyObject, Options> = async (
  input,
  options,
  context,
) => {
  if (!input || (!options.schema && !options.schemaUri)) {
    return;
  }

  const mediaType = options.mediaType ?? APPLICATION_JSON_TYPE;
  const content = input.content ? input.content[mediaType] : undefined;

  if (!content) {
    return;
  }

  const schema = content.schema as OpenAPIV3_0.SchemaObject | undefined;

  if (!schema) {
    return errorMessage(`Response schema for media type "${mediaType}" is missing.`, [...context.path, 'content', mediaType]);
  }

  let refSchema = options.schema;

  if (options.schemaUri) {
    try {
      refSchema = await getRefSchema(options.schemaUri);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return errorMessage(`Could not load reference schema: ${message}`, [...context.path, 'content', mediaType]);
    }
  }

  if (!refSchema) {
    return;
  }

  const errors = matchSchema(schema, refSchema);

  if (errors.length > 0) {
    return errorMessage(`Response schema is not compatible. ` + errors.join(' '), [...context.path, 'content', mediaType]);
  }
};

export default hasSchemaMatch;
