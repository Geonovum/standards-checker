import { OpenAPIV3_0 } from '@geonovum/standards-checker';
import type { IFunctionResult, RulesetFunctionContext } from '@stoplight/spectral-core';
export { groupBy, groupBySource, handleResponse, handleResponseJson, formatDocument } from '@geonovum/standards-checker';
export declare const errorMessage: (message: string, path?: (string | number)[]) => IFunctionResult[];
export declare const errorStr: (error: string, path: string[]) => string;
/**
 * This function recursively matches a schema with a given reference schema.
 *
 * - Equality of schema types & formats
 * - Presence of required properties for object schemas
 *
 * @param schema    The schema
 * @param refSchema The reference schema
 * @returns An array of error messages
 */
export declare const matchSchema: (schema: OpenAPIV3_0.SchemaObject, refSchema: OpenAPIV3_0.SchemaObject, path?: string[]) => string[];
export declare const queryPath: (context: RulesetFunctionContext, path: string) => Promise<unknown>;
export declare const getParent: (context: RulesetFunctionContext) => unknown;
//# sourceMappingURL=util.d.ts.map