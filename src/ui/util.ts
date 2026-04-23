import {
  formatDocument,
  handleResponse,
  handleResponseJson,
  groupBy as sharedGroupBy,
  groupBySource as sharedGroupBySource,
} from '../util';
import type { Diagnostic } from './types';

export const groupBy = sharedGroupBy;
export const groupBySource = (diagnostics: Diagnostic[]) => sharedGroupBySource(diagnostics);
export { formatDocument, handleResponse, handleResponseJson };
