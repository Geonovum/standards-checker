import { formatDocument, groupBy as sharedGroupBy, groupBySource as sharedGroupBySource, handleResponse, handleResponseJson, } from '../shared/util.js';
export const groupBy = sharedGroupBy;
export const groupBySource = (diagnostics) => sharedGroupBySource(diagnostics);
export { handleResponse, handleResponseJson, formatDocument };
