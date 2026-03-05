import type { RunFormat, RulesetPlugin, ValidationResult } from '../types';
import { renderTable } from './table';
import { renderJson } from './json';

export const formatOutput = (plugin: RulesetPlugin, result: ValidationResult, format: RunFormat): string => {
  switch (format) {
    case 'table':
      return renderTable(plugin, result);
    case 'json':
      return renderJson(plugin, result);
    default:
      throw new Error(`Unsupported output format '${format}'.`);
  }
};
