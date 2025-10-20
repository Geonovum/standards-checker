import { RulesetDefinition } from '@stoplight/spectral-core';
import type { Extension } from '@uiw/react-codemirror';
export interface Rulesets {
    [confClass: string]: RulesetDefinition;
}
export declare const spectralLinter: (name: string, ruleset: RulesetDefinition) => Extension;
//# sourceMappingURL=spectral.d.ts.map