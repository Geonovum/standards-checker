import * as SpectralCore from '@stoplight/spectral-core';
import type { RulesetDefinition } from '@stoplight/spectral-core';
import * as Parsers from '@stoplight/spectral-parsers';
import * as SpectralFormats from '@stoplight/spectral-formats';
import type {
  FailLevel,
  RunContext,
  RunFormat,
  RunOptions,
  RunResult,
  RulesetPlugin,
  ValidationDiagnostic,
  ValidationResult,
} from './types';
import { mapSeverity } from './types';
import { formatOutput } from './formatters';

type SpectralCoreModule = typeof import('@stoplight/spectral-core');
type SpectralParsersModule = typeof import('@stoplight/spectral-parsers');
type SpectralFormatsModule = typeof import('@stoplight/spectral-formats');

const spectralCore =
  (SpectralCore as unknown as { default?: SpectralCoreModule }).default ?? (SpectralCore as unknown as SpectralCoreModule);
const parsers = (Parsers as unknown as { default?: SpectralParsersModule }).default ?? (Parsers as unknown as SpectralParsersModule);
const spectralFormats = ((SpectralFormats as unknown as { default?: SpectralFormatsModule }).default ??
  (SpectralFormats as unknown as SpectralFormatsModule)) as Record<string, unknown>;

const { Document, Spectral } = spectralCore;
const { Json } = parsers;

interface NormalizedRulesets {
  map: Record<string, RulesetDefinition>;
  ids: string[];
}

const severityWeight: Record<ValidationDiagnostic['severity'], number> = {
  error: 3,
  warning: 2,
  info: 1,
  hint: 0,
};

const DEFAULT_FORMAT: RunFormat = 'table';
const DEFAULT_FAIL_ON: FailLevel = 'error';

const toRulesetDefinition = (value: unknown): RulesetDefinition | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  if ('rules' in (value as Record<string, unknown>) || 'extends' in (value as Record<string, unknown>)) {
    return value as RulesetDefinition;
  }

  return undefined;
};

const normalizeRulesets = (plugin: RulesetPlugin): NormalizedRulesets => {
  const map: Record<string, RulesetDefinition> = {};

  if (plugin.rulesets && typeof plugin.rulesets === 'object') {
    for (const [key, value] of Object.entries(plugin.rulesets as Record<string, unknown>)) {
      const ruleset = toRulesetDefinition(value);

      if (ruleset) {
        map[key] = withResolvedFormats(ruleset);
      }
    }
  }

  if (plugin.rules) {
    const rulesArray = Array.isArray(plugin.rules) ? plugin.rules : [plugin.rules];
    const ruleset = rulesArray.map(toRulesetDefinition).find(Boolean);

    if (ruleset) {
      map[plugin.id] = withResolvedFormats(ruleset);
    }
  }

  const ids = Object.keys(map);

  if (ids.length === 0) {
    throw new Error(`Ruleset plugin '${plugin.id}' bevat geen geldige rulesets.`);
  }

  return { map, ids };
};

const isFormatFunction = (candidate: unknown): candidate is (document: unknown) => boolean => typeof candidate === 'function';

const resolveFormat = (format: unknown) => {
  if (isFormatFunction(format)) {
    return format;
  }

  if (typeof format === 'string' && isFormatFunction(spectralFormats[format])) {
    return spectralFormats[format];
  }

  return undefined;
};

const withResolvedFormats = (ruleset: RulesetDefinition): RulesetDefinition => {
  if (!ruleset.formats) {
    return ruleset;
  }

  const original = Array.isArray(ruleset.formats) ? ruleset.formats : Array.from(ruleset.formats);
  const resolved = original.map(resolveFormat).filter((format): format is (document: unknown) => boolean => isFormatFunction(format));

  if (Array.isArray(ruleset.formats)) {
    (ruleset as unknown as { formats: typeof resolved }).formats = resolved;
  } else {
    (ruleset as unknown as { formats: Set<(document: unknown) => boolean> }).formats = new Set(resolved);
  }

  return ruleset;
};

const ensureValidationResult = (value: unknown): ValidationResult => {
  if (!value || typeof value !== 'object') {
    throw new Error('Postprocess hook moet een validation result teruggeven.');
  }

  const candidate = value as ValidationResult;

  if (!Array.isArray(candidate.diagnostics)) {
    throw new Error('Validation result mist diagnostics array.');
  }

  return candidate;
};

const shouldFail = (diagnostics: ValidationDiagnostic[], failOn: FailLevel): boolean => {
  switch (failOn) {
    case 'none':
      return false;
    case 'warn':
      return diagnostics.some(diagnostic => severityWeight[diagnostic.severity] >= severityWeight.warning);
    default:
      return diagnostics.some(diagnostic => diagnostic.severity === 'error');
  }
};

const normalizeFormat = (format?: string): RunFormat => {
  if (!format) {
    return DEFAULT_FORMAT;
  }

  const value = format.toLowerCase();

  if (value === 'table' || value === 'json') {
    return value;
  }

  throw new Error(`Unknown format '${format}'. Expected table or json.`);
};

const normalizeFailLevel = (level?: string): FailLevel => {
  if (!level) {
    return DEFAULT_FAIL_ON;
  }

  const value = level.toLowerCase();

  if (value === 'none' || value === 'warn' || value === 'warning' || value === 'error') {
    return value === 'warning' ? 'warn' : (value as FailLevel);
  }

  throw new Error(`Unknown fail level '${level}'. Expected none, warn, or error.`);
};

const withPluginFunctions = (ruleset: RulesetDefinition, plugin: RulesetPlugin): RulesetDefinition => {
  if (!plugin.funcs || typeof plugin.funcs !== 'object') {
    return ruleset;
  }

  const existing = (ruleset as Record<string, unknown>).functions as Record<string, unknown> | undefined;

  return {
    ...(ruleset as Record<string, unknown>),
    functions: {
      ...(existing ?? {}),
      ...(plugin.funcs as Record<string, unknown>),
    },
  } as unknown as RulesetDefinition;
};

export const run = async (document: unknown, plugin: RulesetPlugin, options: RunOptions = {}): Promise<RunResult> => {
  if (!plugin || typeof plugin !== 'object') {
    throw new Error('Invalid ruleset plugin provided.');
  }

  if (!plugin.id) {
    throw new Error('Ruleset plugin is missing an id property.');
  }
  const format = normalizeFormat(options.format ? String(options.format) : undefined);
  const failOn = normalizeFailLevel(options.failOn ? String(options.failOn) : undefined);

  const context: RunContext = { plugin };
  const normalized = normalizeRulesets(plugin);

  let workingDocument = document;

  if (plugin.preprocess) {
    workingDocument = await plugin.preprocess(document, context);
  }

  const jsonContent = typeof workingDocument === 'string' ? workingDocument : JSON.stringify(workingDocument, null, 2);

  const diagnostics: ValidationDiagnostic[] = [];

  for (const rulesetId of normalized.ids) {
    const spectral = new Spectral();
    spectral.setRuleset(withPluginFunctions(normalized.map[rulesetId], plugin));

    const doc = new Document(jsonContent, Json);
    const violations = await spectral.run(doc);

    diagnostics.push(
      ...violations.map(violation => ({
        severity: mapSeverity(violation.severity),
        message: violation.message,
        code: String(violation.code),
        path: violation.path,
        range: violation.range,
        documentationUrl: violation.documentationUrl,
        source: violation.source ?? rulesetId,
      })),
    );
  }

  const valid = !diagnostics.some(diagnostic => diagnostic.severity === 'error');

  let result: ValidationResult = {
    valid,
    diagnostics,
    content: jsonContent,
    rulesets: normalized.ids,
  };

  if (plugin.postprocess) {
    const postResult = await plugin.postprocess(result, context);

    if (postResult) {
      result = ensureValidationResult(postResult);
    }
  }

  const output = formatOutput(plugin, result, format);
  const exitCode = shouldFail(result.diagnostics, failOn) ? 1 : 0;

  return {
    exitCode,
    output,
    result,
  };
};
