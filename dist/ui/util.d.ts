import type { Diagnostic } from './types';
export declare const groupBy: <T>(arr: T[], key: (i: T) => string) => Record<string, T[]>;
export declare const handleResponse: (response: Response, uri: string) => Promise<string>;
export declare const handleResponseJson: (response: Response, uri: string) => Promise<any>;
export declare const groupBySource: (diagnostics: Diagnostic[]) => Record<string, Diagnostic[]>;
export declare const formatDocument: (content: string) => string;
//# sourceMappingURL=util.d.ts.map