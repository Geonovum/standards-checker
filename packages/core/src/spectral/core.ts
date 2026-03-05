/**
 * Re-exports from @stoplight/spectral-core.
 * Consumer apps can import from '@geonovum/standards-checker/spectral/core'
 * instead of depending on @stoplight/spectral-core directly.
 *
 * CJS→ESM interop: Node's native ESM puts CJS exports on `.default`, while
 * bundlers (Vite/esbuild) put them directly on the namespace. We handle both.
 */
import * as _SpectralCore from '@stoplight/spectral-core';

const SpectralCore = (_SpectralCore as unknown as { default?: typeof _SpectralCore }).default ?? _SpectralCore;

export const {
  Document,
  ParsedDocument,
  DEFAULT_PARSER_OPTIONS,
  Spectral,
  assertValidRuleset,
  RulesetValidationError,
  getDiagnosticSeverity,
  createRulesetFunction,
  Ruleset,
  Formats,
  Rule,
} = SpectralCore;

export type {
  IFunctionResult,
  ISpectralDiagnostic,
  RulesetDefinition,
  RulesetFunction,
  RulesetFunctionContext,
} from '@stoplight/spectral-core';
