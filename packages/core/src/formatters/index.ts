import type { RulesetPlugin, RunFormat, ValidationResult } from '../types';
import { renderJson } from './json';
import { renderTable } from './table';

export const formatOutput = (plugin: RulesetPlugin, result: ValidationResult, format: RunFormat): string => {
  switch (format) {
    case 'table':
      return renderTable(plugin, result);
    case 'json':
      return renderJson(result);
    default:
      throw new Error(`Unsupported output format '${format}'.`);
  }
};
