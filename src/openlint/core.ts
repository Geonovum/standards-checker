/**
 * Re-exports from @openlint/openlint-core.
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
  OpenLint,
  ParsedDocument,
  Rule,
  Ruleset,
  RulesetValidationError,
} from '@openlint/openlint-core';

export type {
  Format,
  HumanReadableDiagnosticSeverity,
  IConstructorOpts,
  IFunction,
  IFunctionResult,
  IGivenNode,
  IOpenLintDiagnostic,
  IOpenLintFullResult,
  IRuleResult,
  IRunOpts,
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
} from '@openlint/openlint-core';
