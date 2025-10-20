/**
 * @geonovum/ogc-checker-core
 *
 * Core validation engine for OGC specifications
 * Supports CLI, programmatic API, and UI integration
 */
export { validate, validateUrl, formatJson } from './engine/validator';
export { GeometryTypes, DocumentTypes } from './ui/types';
export * from './engine/functions';
export * from './ui';
