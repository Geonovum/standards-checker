import { RulesetFunction } from '@stoplight/spectral-core';
import { OpenAPIV3_0 } from '@geonovum/standards-checker';
export interface Options {
    schema?: OpenAPIV3_0.SchemaObject;
    schemaUri?: string;
    mediaType?: string;
}
declare const hasSchemaMatch: RulesetFunction<OpenAPIV3_0.ResponseObject | OpenAPIV3_0.RequestBodyObject, Options>;
export default hasSchemaMatch;
//# sourceMappingURL=hasSchemaMatch.d.ts.map