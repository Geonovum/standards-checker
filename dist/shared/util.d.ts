export declare const groupBy: <T>(arr: T[], key: (item: T) => string) => Record<string, T[]>;
export declare const groupBySource: <T extends {
    source?: string;
}>(diagnostics: T[]) => Record<string, T[]>;
export declare const handleResponse: (response: Response, uri: string) => Promise<string>;
export declare const handleResponseJson: (response: Response, uri: string) => Promise<any>;
export declare const formatDocument: (content: string) => string;
//# sourceMappingURL=util.d.ts.map