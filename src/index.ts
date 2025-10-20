/**
 * @geonovum/standards-checker
 * 
 * Core validation engine for OGC specifications
 * Supports CLI, programmatic API, and UI integration
 */

export { validate, validateUrl, formatJson } from './engine/validator';
export type {
  ValidationResult,
  ValidationDiagnostic,
  ValidateOptions,
  ValidateUrlOptions,
  Spec as EngineSpec,
} from './engine/types';
export { GeometryTypes, DocumentTypes } from './ui/types';
export * as EngineUtil from './engine/util';
export * as SharedUtil from './shared/util';
export * from './engine/functions';
export * from './ui';
