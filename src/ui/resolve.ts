import type { RulesetDefinition } from '@stoplight/spectral-core';
import type { Standard, StandardVersion } from '../standards';
import { spectralChecker } from './spectral';
import type { ConformanceClass } from './types';

/**
 * A standard + version bundled with its derived per-conformance-class checkers.
 *
 * `conformanceClasses` is built eagerly from `version.rulesets`. `toConformanceClasses` re-derives
 * them for an arbitrary ruleset subset — used by the `?url=` responseMapper
 * path, where the matched rulesets are only known after the fetch.
 */
export interface ResolvedVersion {
  standard: Standard;
  version: StandardVersion;
  conformanceClasses: ConformanceClass[];
  toConformanceClasses: (rulesets: Record<string, RulesetDefinition>) => ConformanceClass[];
}

export const resolveVersion = (standard: Standard, version: StandardVersion): ResolvedVersion => {
  const label = version.sourceLabel ?? ((uri: string) => uri);

  const toConformanceClasses = (rulesets: Record<string, RulesetDefinition>): ConformanceClass[] =>
    Object.entries(rulesets).map(([uri, def]) => {
      const name = label(uri);
      return { name, href: uri, extension: spectralChecker(name, def) };
    });

  return { standard, version, conformanceClasses: toConformanceClasses(version.rulesets), toConformanceClasses };
};
