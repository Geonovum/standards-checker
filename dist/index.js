/**
 * @geonovum/ogc-checker-core
 *
 * Core validation engine for OGC specifications
 * Supports CLI, programmatic API, and UI integration
 */
// Engine exports (headless validation)
export { validate, validateUrl, formatJson } from './engine/validator';
// UI exports (for React integration)
export * from './ui';
