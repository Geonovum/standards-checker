import type { RulesetDefinition } from '@stoplight/spectral-core';
import { Document, Spectral, detectEncoding } from './encodings';
import type { ValidateOptions, ValidateUrlOptions, ValidationDiagnostic, ValidationResult } from './types';
import { mapSeverity } from './types';

const ACCEPT_HEADER = 'application/json, application/yaml;q=0.9, text/yaml;q=0.9, */*;q=0.1';

export async function validate(options: ValidateOptions): Promise<ValidationResult> {
  const { content, rulesets, rulesetNames } = options;

  const activeRulesets = rulesetNames
    ? Object.fromEntries(Object.entries(rulesets).filter(([name]) => rulesetNames.includes(name)))
    : rulesets;

  const spectral = new Spectral();

  const mergedRuleset: RulesetDefinition = {
    rules: {},
  };

  Object.values(activeRulesets).forEach(ruleset => {
    if (typeof ruleset === 'object' && 'rules' in ruleset) {
      Object.assign(mergedRuleset.rules, ruleset.rules);
    }
  });

  spectral.setRuleset(mergedRuleset);

  const document = new Document(content, detectEncoding(content).parser);
  const violations = await spectral.run(document);

  const diagnostics: ValidationDiagnostic[] = violations.map(violation => ({
    severity: mapSeverity(violation.severity),
    message: violation.message,
    code: String(violation.code),
    path: violation.path,
    range: violation.range,
    documentationUrl: violation.documentationUrl,
    source: violation.source,
  }));

  const valid = !diagnostics.some(d => d.severity === 'error');

  return {
    valid,
    diagnostics,
    content,
    rulesets: Object.keys(activeRulesets),
  };
}

export async function validateUrl(options: ValidateUrlOptions): Promise<ValidationResult> {
  const { url, rulesets, rulesetNames, headers = {} } = options;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: ACCEPT_HEADER,
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
    throw new Error(`Error validating URL: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

export { formatDocument as formatJson } from './util';
