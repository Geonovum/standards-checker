/**
 * Re-exports from @stoplight/spectral-core.
 * Explicit named re-exports (not `export *`) so Vite / Rolldown can statically
 * resolve names from the CJS source module.
 */
export {
  assertValidRuleset,
  createRulesetFunction,
  DEFAULT_PARSER_OPTIONS,
  Document,
  Formats,
  getDiagnosticSeverity,
  ParsedDocument,
  Rule,
  Ruleset,
  RulesetValidationError,
  Spectral,
} from '@stoplight/spectral-core';

export type {
  Format,
  HumanReadableDiagnosticSeverity,
  IConstructorOpts,
  IFunction,
  IFunctionResult,
  IGivenNode,
  IRuleResult,
  IRunOpts,
  ISpectralDiagnostic,
  ISpectralFullResult,
  JSONSchema,
  ParserOptions,
  RuleDefinition,
  RulesetDefinition,
  RulesetFunction,
  RulesetFunctionContext,
  RulesetFunctionSchemaDefinition,
  RulesetFunctionWithValidator,
  StringifiedRule,
  StringifiedRuleset,
} from '@stoplight/spectral-core';
