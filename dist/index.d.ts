/**
 * @geonovum/standards-checker
 *
 * Core validation engine for OGC specifications
 * Supports CLI, programmatic API, and UI integration
 */
export { validate, validateUrl, formatJson } from './engine/validator';
export type { ValidationResult, ValidationDiagnostic, ValidateOptions, ValidateUrlOptions, Spec as EngineSpec, RulesetPlugin, RulesetPluginIndex, RunOptions, RunResult, RunFormat, FailLevel, } from './engine/types';
export { run } from './engine/run';
export { APPLICATION_JSON_TYPE, APPLICATION_GEO_JSON_TYPE, APPLICATION_OPENAPI_JSON_3_0_TYPE } from './shared/constants';
export * as EngineUtil from './engine/util';
export * as SharedUtil from './shared/util';
export * from './engine/functions';
export * from './ui';
//# sourceMappingURL=index.d.ts.map