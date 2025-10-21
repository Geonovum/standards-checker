import type { IFunctionResult, RulesetFunction } from '@stoplight/spectral-core';
import { OpenAPIV3_0 } from '../openapi-types';
export interface Options {
    spec: OpenAPIV3_0.ParameterObject;
    validateSchema?: (schema: OpenAPIV3_0.SchemaObject, paramPath: (string | number)[]) => IFunctionResult[];
}
declare const hasParameter: RulesetFunction<OpenAPIV3_0.OperationObject, Options>;
export default hasParameter;
//# sourceMappingURL=hasParameter.d.ts.map