import { OpenAPIV3_0 } from './openapi-types';
import type { IFunctionResult, RulesetFunctionContext } from '@stoplight/spectral-core';
import mergeAllOf from 'json-schema-merge-allof';
import nimma from 'nimma';
import { last, omit } from 'ramda';

export { groupBy, groupBySource, handleResponse, handleResponseJson, formatDocument } from '../shared/util';

// Spec-specific utilities
export const errorMessage = (message: string, path?: (string | number)[]): IFunctionResult[] => [{ message, path }];

export const errorStr = (error: string, path: string[]) =>
  path.length > 0 ? `${error} (schema path: "${path.map(error => error.replace('/', '\\/')).join('/')}")` : error;

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
export const matchSchema = (schema: OpenAPIV3_0.SchemaObject, refSchema: OpenAPIV3_0.SchemaObject, path: string[] = []): string[] => {
  const errors: string[] = [];

  if (schema.oneOf) {
    return schema.oneOf.flatMap((oneOf: any) =>
      matchSchema(
        {
          ...omit(['oneOf'], schema),
          ...oneOf,
        } as OpenAPIV3_0.SchemaObject,
        refSchema,
        path
      )
    );
  }

  if (schema.allOf || refSchema.allOf) {
    // TODO: Handle situations where merged JSON schema is not compatible with OpenAPI 3.0 schema object (e.g. multiple types)
    return matchSchema(
      schema.allOf ? (mergeAllOf(schema.allOf) as OpenAPIV3_0.SchemaObject) : schema,
      refSchema.allOf ? (mergeAllOf(refSchema.allOf) as OpenAPIV3_0.SchemaObject) : refSchema
    );
  }

  if (refSchema.type && schema.type !== refSchema.type) {
    errors.push(errorStr(`Schema type must be "${refSchema.type}".`, path));
  }

  if (refSchema.format && schema.format !== refSchema.format) {
    errors.push(errorStr(`Schema format must be "${refSchema.format}".`, path));
  }

  if (refSchema.enum && schema.enum && !schema.enum.every((value: any) => refSchema.enum?.includes(value))) {
    errors.push(errorStr(`Schema enum must match [${refSchema.enum}].`, path));
  }

  if (refSchema.type === 'object' && schema.type === 'object') {
    refSchema.required?.forEach((req: any) => {
      if (!schema.required?.includes(req)) {
        errors.push(errorStr(`Property "${req}" must be required.`, path));
      }
    });

    Object.entries(refSchema.properties ?? {}).forEach(([propName, refPropSchema]) => {
      const propSchema = (schema.properties ?? {})[propName];

      if (!propSchema && refSchema.required?.includes(propName)) {
        errors.push(errorStr(`Required property "${propName}" is missing.`, path));
      }

      if (propSchema) {
        matchSchema(propSchema, refPropSchema, [...path, propName]).forEach(error => errors.push(error));
      }
    });
  }

  if (refSchema.type === 'array' && schema.type === 'array') {
    matchSchema(schema.items, refSchema.items, path).forEach(error => errors.push(error));
  }

  return errors;
};


export const queryPath = (context: RulesetFunctionContext, path: string): Promise<unknown> => {
  const documentInventory = context.documentInventory;

  if (!('resolved' in documentInventory)) {
    throw new Error('Context does not contain resolved document.');
  }

  const document = documentInventory.resolved;

  return new Promise(resolve => {
    nimma.query(document, {
      [path]: scope => resolve(scope.value),
    });
  });
};

export const getParent = (context: RulesetFunctionContext): unknown => {
  if (context.path.length === 0) {
    return;
  }

  const parentPath = ['$', ...context.path.slice(0, context.path.length - 1)];
  const lastSegment = last(parentPath);

  if (typeof lastSegment === 'number') {
    parentPath.pop();
  }

  return queryPath(context, parentPath.join('.'));
};
