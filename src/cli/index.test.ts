import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Standard, StandardVersion, VersionStatus } from '../standards';
import { resolveSelection } from './index';

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
const standards = [adr];

afterEach(() => vi.restoreAllMocks());

describe('resolveSelection', () => {
  it('resolves a deprecated --ruleset alias to its (standard, version) and warns on stderr', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const selection = resolveSelection(standards, { ruleset: 'adr-20' });

    expect(selection.standard.slug).toBe('adr');
    expect(selection.version.id).toBe('2.0');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('--ruleset is deprecated'));
  });

  it('resolves the --ruleset collision (adr) to the Werkversie draft, unlike --standard adr', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(resolveSelection(standards, { ruleset: 'adr' }).version.id).toBe('werkversie');
  });

  it('throws for an unknown --ruleset, listing the available legacy slugs', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => resolveSelection(standards, { ruleset: 'nope' })).toThrow(
      /Ruleset 'nope' not found\. Available: adr, adr-20, adr-21, adr-consult\./,
    );
  });

  it('requires --standard when neither --ruleset nor --standard is given', () => {
    expect(() => resolveSelection(standards, {})).toThrow(/--standard is required\. Available: adr\./);
  });

  it('throws for an unknown --standard', () => {
    expect(() => resolveSelection(standards, { standard: 'missing' })).toThrow(/Standard 'missing' not found/);
  });

  it('selects an explicit --version', () => {
    expect(resolveSelection(standards, { standard: 'adr', version: 'consultatie' }).version.id).toBe('consultatie');
  });

  it('throws for an unknown --version, listing the available ids', () => {
    expect(() => resolveSelection(standards, { standard: 'adr', version: '9.9' })).toThrow(
      /Version '9.9' not found for standard 'adr'\. Available: 2.0, 2.1, consultatie, werkversie\./,
    );
  });

  it('defaults to the latest final version when --version is omitted', () => {
    expect(resolveSelection(standards, { standard: 'adr' }).version.id).toBe('2.1');
  });
});
