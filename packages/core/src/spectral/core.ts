/**
 * Re-exports from @stoplight/spectral-core.
 * Consumer apps can import from '@geonovum/standards-checker/spectral/core'
 * instead of depending on @stoplight/spectral-core directly.
 *
 * Uses default import + destructured re-export because @stoplight/spectral-core
 * is CJS and `export *` from CJS doesn't expose named exports properly in ESM bundlers.
 */
import SpectralCore from '@stoplight/spectral-core';

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
