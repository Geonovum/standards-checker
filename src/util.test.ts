import { describe, expect, it } from 'vitest';
import type { OpenAPIV3_0 } from './openapi-types';
import { matchSchema } from './util';

describe('matchSchema', () => {
  it('terminates on a self-referencing schema on both sides', () => {
    type Cyclic = OpenAPIV3_0.SchemaObject & { properties: Record<string, OpenAPIV3_0.SchemaObject> };

    const schema: Cyclic = { type: 'object', properties: {} };
    schema.properties.self = schema;

    const refSchema: Cyclic = { type: 'object', properties: {} };
    refSchema.properties.self = refSchema;

    expect(matchSchema(schema, refSchema)).toEqual([]);
  });

  it('terminates when only the schema side has a cycle', () => {
    type Cyclic = OpenAPIV3_0.SchemaObject & { properties: Record<string, OpenAPIV3_0.SchemaObject> };

    const schema: Cyclic = { type: 'object', properties: {} };
    schema.properties.self = schema;

    const refSchema: OpenAPIV3_0.SchemaObject = {
      type: 'object',
      properties: { self: { type: 'object' } },
    };

    expect(matchSchema(schema, refSchema)).toEqual([]);
  });

  it('still reports errors for non-cyclic mismatches', () => {
    const schema: OpenAPIV3_0.SchemaObject = { type: 'object', properties: { name: { type: 'integer' } } };
    const refSchema: OpenAPIV3_0.SchemaObject = {
      type: 'object',
      required: ['name'],
      properties: { name: { type: 'string' } },
    };

    const errors = matchSchema(schema, refSchema);

    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/Property "name" must be required/);
    expect(errors[1]).toMatch(/Schema type must be "string"/);
  });
});
