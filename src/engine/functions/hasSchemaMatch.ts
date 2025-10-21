import { resolveHttp } from '@stoplight/json-ref-readers';
import { extname } from '@stoplight/path';
import type { RulesetFunction } from '@stoplight/spectral-core';
import * as Parsers from '@stoplight/spectral-parsers';
import { Resolver } from '@stoplight/spectral-ref-resolver';
import { errorMessage, matchSchema } from '../util';
import type { OpenAPIV3_0 } from '../openapi-types';
import { APPLICATION_JSON_TYPE } from '../../shared/constants';

type SpectralParsersModule = typeof import('@stoplight/spectral-parsers');

const parsers =
  ((Parsers as unknown as { default?: SpectralParsersModule }).default ??
    (Parsers as unknown as SpectralParsersModule));
const { Json, Yaml } = parsers;

export interface Options {
  schema?: OpenAPIV3_0.SchemaObject;
  schemaUri?: string;
  mediaType?: string;
}

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

const hasSchemaMatch: RulesetFunction<OpenAPIV3_0.ResponseObject | OpenAPIV3_0.RequestBodyObject, Options> = async (
  input,
  options,
  context
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
    refSchema = await fetch(options.schemaUri)
      .then(response => response.text())
      .then(responseText => Yaml.parse(responseText).data)
      .then(responseSchema =>
        resolver
          .resolve(responseSchema, { baseUri: options.schemaUri })
          .then((result: { result: unknown }) => result.result as OpenAPIV3_0.SchemaObject)
      );
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
