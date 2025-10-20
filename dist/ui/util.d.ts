import type { Diagnostic } from './types';
import { formatDocument, handleResponse, handleResponseJson } from '../shared/util';
export declare const groupBy: <T>(arr: T[], key: (item: T) => string) => Record<string, T[]>;
export declare const groupBySource: (diagnostics: Diagnostic[]) => Record<string, Diagnostic[]>;
export { handleResponse, handleResponseJson, formatDocument };
//# sourceMappingURL=util.d.ts.map