import type { RulesetDefinition } from '@stoplight/spectral-core';
import type { Standard, StandardVersion } from '../standards';
import { spectralLinter } from './spectral';
import type { SpecLinter } from './types';

/**
 * A standard + version bundled with its derived CodeMirror linters.
 *
 * `linters` is built eagerly from `version.rulesets`. `toLinters` re-derives
 * linters for an arbitrary ruleset subset — used by the `?url=` responseMapper
 * path, where the matched rulesets are only known after the fetch.
 */
export interface ResolvedVersion {
  standard: Standard;
  version: StandardVersion;
  linters: SpecLinter[];
  toLinters: (rulesets: Record<string, RulesetDefinition>) => SpecLinter[];
}

export const resolveVersion = (standard: Standard, version: StandardVersion): ResolvedVersion => {
  const label = version.sourceLabel ?? ((uri: string) => uri);

  const toLinters = (rulesets: Record<string, RulesetDefinition>): SpecLinter[] =>
    Object.entries(rulesets).map(([uri, def]) => {
      const name = label(uri);
      return { name, href: uri, linter: spectralLinter(name, def) };
    });

  return { standard, version, linters: toLinters(version.rulesets), toLinters };
};
