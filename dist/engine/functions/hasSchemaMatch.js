import { resolveHttp } from '@stoplight/json-ref-readers';
import { extname } from '@stoplight/path';
import * as Parsers from '@stoplight/spectral-parsers';
import { Resolver } from '@stoplight/spectral-ref-resolver';
import { errorMessage, matchSchema } from '../util.js';
import { APPLICATION_JSON_TYPE } from '../../shared/constants.js';
const parsers = (Parsers.default ??
    Parsers);
const { Json, Yaml } = parsers;
const resolver = new Resolver({
    resolvers: {
        http: { resolve: resolveHttp },
        https: { resolve: resolveHttp },
    },
    parseResolveResult: (opts) => {
        const source = opts.targetAuthority.href().replace(/\/$/, '');
        const parser = extname(source) === '.json' ? Json : Yaml;
        const parseResult = parser.parse(opts.result);
        return Promise.resolve({
            result: parseResult.data,
        });
    },
});
const hasSchemaMatch = async (input, options, context) => {
    if (!input || (!options.schema && !options.schemaUri)) {
        return;
    }
    const mediaType = options.mediaType ?? APPLICATION_JSON_TYPE;
    const content = input.content ? input.content[mediaType] : undefined;
    if (!content) {
        return;
    }
    const schema = content.schema;
    if (!schema) {
        return errorMessage(`Response schema for media type "${mediaType}" is missing.`, [...context.path, 'content', mediaType]);
    }
    let refSchema = options.schema;
    if (options.schemaUri) {
        refSchema = await fetch(options.schemaUri)
            .then(response => response.text())
            .then(responseText => Yaml.parse(responseText).data)
            .then(responseSchema => resolver
            .resolve(responseSchema, { baseUri: options.schemaUri })
            .then((result) => result.result));
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
