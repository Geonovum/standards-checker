/**
 * Re-exports from @openlint/openlint-parsers.
 * Explicit named re-exports (not `export *`) so Vite / Rolldown can statically
 * resolve names from the CJS source module.
 */
export { Json, parseJson, parseYaml, Yaml } from '@openlint/openlint-parsers';

export type { IParser, JsonParserResult, YamlParserResult } from '@openlint/openlint-parsers';
