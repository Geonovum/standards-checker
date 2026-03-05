/**
 * @geonovum/standards-checker
 *
 * Core validation engine for standards checking
 * Supports CLI, programmatic API, and UI integration
 */

export { validate, validateUrl, formatJson } from './validator';
export type {
  ValidationResult,
  ValidationDiagnostic,
  ValidateOptions,
  ValidateUrlOptions,
  Spec,
  RulesetPlugin,
  RulesetPluginIndex,
  RunOptions,
  RunResult,
  RunFormat,
  RunContext,
  FailLevel,
} from './types';
export { mapSeverity } from './types';
export { run } from './run';
export { APPLICATION_JSON_TYPE, APPLICATION_GEO_JSON_TYPE, APPLICATION_OPENAPI_JSON_3_0_TYPE } from './constants';
export {
  groupBy,
  groupBySource,
  handleResponse,
  handleResponseJson,
  formatDocument,
  errorMessage,
  errorStr,
  matchSchema,
  queryPath,
  getParent,
} from './util';
export * from './functions';
export type { OpenAPIV3_0 } from './openapi-types';
