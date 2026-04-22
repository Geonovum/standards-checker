/**
 * Re-exports from @stoplight/spectral-parsers.
 * Explicit named re-exports (not `export *`) so Vite / Rolldown can statically
 * resolve names from the CJS source module.
 */
export { Json, parseJson, parseYaml, Yaml } from '@stoplight/spectral-parsers';

export type { IParser, JsonParserResult, YamlParserResult } from '@stoplight/spectral-parsers';
