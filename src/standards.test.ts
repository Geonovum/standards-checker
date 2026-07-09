import { describe, expect, it } from 'vitest';
import {
  buildLegacyIndex,
  findStandard,
  findVersion,
  resolveDefaultVersion,
  type Standard,
  type StandardVersion,
  type VersionStatus,
} from './standards';

const version = (id: string, status: VersionStatus, legacySlug?: string): StandardVersion => ({
  id,
  label: id,
  status,
  example: '{}',
  rulesets: {},
  legacySlug,
});

// Mirrors don-checker's API Design Rules standard (ascending, no explicit default).
const adr: Standard = {
  name: 'API Design Rules',
  slug: 'adr',
  versions: [
    version('2.0', 'final', 'adr-20'),
    version('2.1', 'final', 'adr-21'),
    version('consultatie', 'draft', 'adr-consult'),
    version('werkversie', 'draft', 'adr'),
  ],
};

describe('resolveDefaultVersion', () => {
  it('honors an explicit defaultVersion', () => {
    const standard: Standard = {
      name: 'S',
      slug: 's',
      defaultVersion: '1.0',
      versions: [version('1.0', 'final'), version('2.0', 'final')],
    };
    expect(resolveDefaultVersion(standard).id).toBe('1.0');
  });

  it('ignores an explicit defaultVersion that matches no version and falls back to latest final', () => {
    const standard: Standard = {
      name: 'S',
      slug: 's',
      defaultVersion: 'nope',
      versions: [version('1.0', 'final'), version('2.0', 'final')],
    };
    expect(resolveDefaultVersion(standard).id).toBe('2.0');
  });

  it('picks the latest final version (last final in config order), not the latest overall', () => {
    // 2.1 is the latest final; werkversie is a later draft.
    expect(resolveDefaultVersion(adr).id).toBe('2.1');
  });

  it('picks the last final even when drafts follow it', () => {
    const standard: Standard = { name: 'X', slug: 'x', versions: [version('2.0', 'final'), version('werkversie', 'draft')] };
    expect(resolveDefaultVersion(standard).id).toBe('2.0');
  });

  it('falls back to the latest version overall when there is no final', () => {
    const standard: Standard = { name: 'D', slug: 'd', versions: [version('a', 'draft'), version('b', 'draft')] };
    expect(resolveDefaultVersion(standard).id).toBe('b');
  });

  it('throws a clear error for a standard with no versions', () => {
    const standard: Standard = { name: 'Empty', slug: 'empty', versions: [] };
    expect(() => resolveDefaultVersion(standard)).toThrow(/no versions/);
  });
});

describe('buildLegacyIndex', () => {
  it('maps each legacySlug to its (standard, version)', () => {
    const legacy = buildLegacyIndex([adr]);
    expect(legacy.get('adr-20')?.version.id).toBe('2.0');
    expect(legacy.get('adr-21')?.version.id).toBe('2.1');
    expect(legacy.get('adr-consult')?.version.id).toBe('consultatie');
  });

  it('resolves the adr collision distinctly per lookup path', () => {
    const standards = [adr];
    const legacy = buildLegacyIndex(standards);
    // Legacy `--ruleset adr` -> Werkversie; standard `--standard adr` -> default 2.1.
    expect(legacy.get('adr')?.version.id).toBe('werkversie');
    expect(resolveDefaultVersion(findStandard(standards, 'adr')!).id).toBe('2.1');
  });

  it('skips versions without a legacySlug', () => {
    const publiccode: Standard = { name: 'publiccode.yml', slug: 'publiccode', versions: [version('0.5', 'final')] };
    expect(buildLegacyIndex([publiccode]).size).toBe(0);
  });
});

describe('findStandard / findVersion', () => {
  it('finds by slug and id', () => {
    const standards = [adr];
    expect(findStandard(standards, 'adr')?.name).toBe('API Design Rules');
    expect(findStandard(standards, 'missing')).toBeUndefined();
    expect(findVersion(adr, 'werkversie')?.status).toBe('draft');
    expect(findVersion(adr, 'missing')).toBeUndefined();
  });
});
