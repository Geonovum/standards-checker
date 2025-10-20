import type { SpecLinter } from './types';
interface CheckerState {
    content: string;
    setContent: (content: string) => void;
    linters: SpecLinter[];
    setLinters: (linters: SpecLinter[]) => void;
    checking: boolean;
    setChecking: (checking: boolean) => void;
    error?: string;
    setError: (error?: string) => void;
}
export declare const useChecker: import("zustand").UseBoundStore<import("zustand").StoreApi<CheckerState>>;
export {};
//# sourceMappingURL=store.d.ts.map