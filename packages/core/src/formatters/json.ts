import type { RulesetPlugin, ValidationResult } from '../types';

export const renderJson = (plugin: RulesetPlugin, result: ValidationResult): string =>
  JSON.stringify(
    {
      plugin: {
        id: plugin.id,
      },
      result,
    },
    null,
    2,
  );
