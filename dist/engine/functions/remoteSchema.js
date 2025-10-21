import betterAjvErrors from '@stoplight/better-ajv-errors';
import addFormats from 'ajv-formats';
import Ajv from 'ajv/dist/2020.js';
const ajv = new Ajv({
    discriminator: true,
    loadSchema: async (uri) => {
        const response = await fetch(uri);
        return response.json();
    },
});
addFormats(ajv);
export const remoteSchema = async (input, options, context) => {
    let schema;
    if (typeof options.schema === 'function') {
        const result = options.schema(input);
        if (result.error) {
            return [result.error];
        }
        else if (result.schema) {
            schema = result.schema;
        }
        else {
            throw new Error('Schema function did not result in a schema or errors.');
        }
    }
    else {
        schema = options.schema;
    }
    return ajv.compileAsync(schema).then(validate => {
        validate(input);
        if (validate.errors) {
            return betterAjvErrors(schema, validate.errors, {
                propertyPath: context.path,
                targetValue: input,
            }).map(({ suggestion, error, path: errorPath }) => ({
                message: suggestion !== void 0 ? `${error}. ${suggestion}` : error,
                path: [...context.path, ...(errorPath !== '' ? errorPath.replace(/^\//, '').split('/') : [])],
            }));
        }
    });
};
export default remoteSchema;
