import type { Diagnostic } from './types';
import {
  isJsonContent,
  formatDocument,
  groupBy as sharedGroupBy,
  groupBySource as sharedGroupBySource,
  handleResponse,
  handleResponseJson,
} from '../util';

export const groupBy = sharedGroupBy;
export const groupBySource = (diagnostics: Diagnostic[]) => sharedGroupBySource(diagnostics);
export { isJsonContent, handleResponse, handleResponseJson, formatDocument };
