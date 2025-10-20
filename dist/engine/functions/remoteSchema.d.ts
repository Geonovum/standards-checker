import { IFunctionResult, RulesetFunction } from '@stoplight/spectral-core';
import { AnySchemaObject } from 'ajv/dist/2020';
export interface Options {
    schema: AnySchemaObject | SchemaFunction;
}
export interface SchemaFunctionResult {
    schema?: AnySchemaObject;
    error?: IFunctionResult;
}
export type SchemaFunction = (input: unknown) => SchemaFunctionResult;
export declare const remoteSchema: RulesetFunction<unknown, Options>;
export default remoteSchema;
//# sourceMappingURL=remoteSchema.d.ts.map