import type { RulesetDefinition } from '@stoplight/spectral-core';

/**
 * First-class Standard -> Version model.
 *
 * A "standard" is version-less (e.g. "API Design Rules"); it owns an ordered
 * list of versions (old -> new). Every ruleset is bound to exactly one version.
 *
 * This module is Node-safe: it imports only the `RulesetDefinition` *type*
 * (elided at build time), so both the browser UI (`src/ui/*`) and the Node CLI
 * (`src/cli/*`) — as well as consumer `cli.ts` entry points — can import a
 * config built on it.
 */

export type VersionStatus = 'final' | 'draft';

export interface VersionInput {
  content: string;
  rulesets?: Record<string, RulesetDefinition>;
}

export type VersionResponseMapper = (responseText: string) => Promise<VersionInput>;

export interface StandardVersion {
  /** URL segment + `--version` value: '2.0', '1.0', 'werkversie'. */
  id: string;
  /** Dropdown text (concise; the header already shows the standard name). */
  label: string;
  /** Drives default resolution + the draft marker. */
  status: VersionStatus;
  /** Editor default document for this version. */
  example: string;
  /** RAW Spectral rulesets, keyed by conformance-class URI. */
  rulesets: Record<string, RulesetDefinition>;
  /** UI linter-name transform; defaults to identity. */
  sourceLabel?: (confClassURI: string) => string;
  /** `?url=` mapper; returns raw rulesets. */
  responseMapper?: VersionResponseMapper;
  /** Old `--ruleset` / old route slug, e.g. 'adr-20'. */
  legacySlug?: string;
}

export interface Standard {
  /** Version-less display name, e.g. 'API Design Rules'. */
  name: string;
  /** URL-friendly slug, e.g. 'adr'. */
  slug: string;
  /** Versions in ascending (old -> new) order. */
  versions: StandardVersion[];
  /** Optional explicit default (a version id). */
  defaultVersion?: string;
}

/**
 * Resolve a standard's default version:
 * 1. explicit `defaultVersion` if it matches a version, else
 * 2. the latest `final` version (last final in config order), else
 * 3. the latest version overall.
 */
export const resolveDefaultVersion = (standard: Standard): StandardVersion => {
  if (standard.defaultVersion) {
    const explicit = standard.versions.find(version => version.id === standard.defaultVersion);
    if (explicit) return explicit;
  }

  const finals = standard.versions.filter(version => version.status === 'final');
  return finals.length ? finals[finals.length - 1] : standard.versions[standard.versions.length - 1];
};

export const findStandard = (standards: Standard[], slug: string): Standard | undefined =>
  standards.find(standard => standard.slug === slug);

export const findVersion = (standard: Standard, id: string): StandardVersion | undefined =>
  standard.versions.find(version => version.id === id);

export interface LegacyHit {
  standard: Standard;
  version: StandardVersion;
}

/**
 * Auto-derive the legacy `--ruleset` / old-route-slug lookup from the config,
 * so old slugs keep resolving to the exact same (standard, version).
 */
export const buildLegacyIndex = (standards: Standard[]): Map<string, LegacyHit> => {
  const index = new Map<string, LegacyHit>();

  for (const standard of standards) {
    for (const version of standard.versions) {
      if (version.legacySlug) {
        index.set(version.legacySlug, { standard, version });
      }
    }
  }

  return index;
};
