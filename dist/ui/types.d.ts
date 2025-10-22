import type { Extension } from '@uiw/react-codemirror';
import type { Diagnostic as CodemirrorDiagnostic } from '@codemirror/lint';
export interface Spec {
    name: string;
    slug: string;
    example: string;
    linters: SpecLinter[];
    responseMapper?: SpecResponseMapper;
}
export interface SpecInput {
    content: string;
    linters?: SpecLinter[];
}
export type SpecLinter = {
    name: string;
    linter: Extension;
};
export type SpecResponseMapper = (responseText: string) => Promise<SpecInput>;
export type Severity = 'hint' | 'info' | 'warning' | 'error';
export type Diagnostic = CodemirrorDiagnostic & {
    documentationUrl?: string;
};
export interface UiStrings {
    checking: string;
    noMatchingRulesets: string;
    noViolations: string;
    lintingErrorsSummary: string;
    showInEditor: string;
    documentation: string;
}
export declare const DEFAULT_UI_STRINGS: UiStrings;
export interface UiConfig {
    strings?: Partial<UiStrings>;
}
//# sourceMappingURL=types.d.ts.map