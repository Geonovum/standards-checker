import type { Diagnostic } from './types';
import {
  formatDocument,
  groupBy as sharedGroupBy,
  groupBySource as sharedGroupBySource,
  handleResponse,
  handleResponseJson,
} from '../shared/util';

export const groupBy = sharedGroupBy;
export const groupBySource = (diagnostics: Diagnostic[]) => sharedGroupBySource(diagnostics);
export { handleResponse, handleResponseJson, formatDocument };
