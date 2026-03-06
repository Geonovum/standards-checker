import { map, omit } from 'ramda';
import type { ValidationResult } from '../types';

export const renderJson = (result: ValidationResult): string => {
  const { valid, diagnostics, rulesets } = result;

  return JSON.stringify({ valid, diagnostics: map(omit(['range']), diagnostics), rulesets }, null, 2);
};
