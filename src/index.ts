/**
 * @geonovum/ogc-checker-core
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
export * from './engine/functions';
export * from './ui';