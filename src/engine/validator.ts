import * as SpectralCore from '@stoplight/spectral-core';
import * as Parsers from '@stoplight/spectral-parsers';
import type { ValidateOptions, ValidateUrlOptions, ValidationResult, ValidationDiagnostic } from './types';
import { mapSeverity } from './types';

type SpectralCoreModule = typeof import('@stoplight/spectral-core');
type SpectralParsersModule = typeof import('@stoplight/spectral-parsers');

const spectralCore =
  ((SpectralCore as unknown as { default?: SpectralCoreModule }).default ??
    (SpectralCore as unknown as SpectralCoreModule));
const parsers =
  ((Parsers as unknown as { default?: SpectralParsersModule }).default ??
    (Parsers as unknown as SpectralParsersModule));

const { Document, Spectral } = spectralCore;
const { Json } = parsers;

/**
 * Validate JSON content against rulesets
 */
export async function validate(options: ValidateOptions): Promise<ValidationResult> {
  const { content, rulesets, rulesetNames } = options;

  // Filter rulesets if names are provided
  const activeRulesets = rulesetNames
    ? Object.fromEntries(Object.entries(rulesets).filter(([name]) => rulesetNames.includes(name)))
    : rulesets;

  const spectral = new Spectral();

  // Apply each ruleset
  // Note: Spectral expects a single ruleset, so we merge them
  const mergedRuleset: any = {
    rules: {},
  };

  Object.values(activeRulesets).forEach(ruleset => {
    if (typeof ruleset === 'object' && 'rules' in ruleset) {
      Object.assign(mergedRuleset.rules, ruleset.rules);
    }
  });

  spectral.setRuleset(mergedRuleset);

  // Parse and validate
  const document = new Document(content, Json);
  const violations = await spectral.run(document);

  // Map violations to diagnostics
  const diagnostics: ValidationDiagnostic[] = violations.map(violation => ({
    severity: mapSeverity(violation.severity),
    message: violation.message,
    code: String(violation.code),
    path: violation.path,
    range: violation.range,
    documentationUrl: violation.documentationUrl,
    source: violation.source,
  }));

  // Check if valid (no errors)
  const valid = !diagnostics.some(d => d.severity === 'error');

  return {
    valid,
    diagnostics,
    content,
    rulesets: Object.keys(activeRulesets),
  };
}

/**
 * Fetch and validate JSON from a URL
 */
export async function validateUrl(options: ValidateUrlOptions): Promise<ValidationResult> {
  const { url, rulesets, rulesetNames, headers = {} } = options;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();

    return validate({
      content,
      rulesets,
      rulesetNames,
    });
  } catch (error) {
    throw new Error(`Error validating URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Format JSON content
 */
export function formatJson(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}
