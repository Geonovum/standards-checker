import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { Readable } from 'node:stream';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Standard, StandardVersion, VersionStatus } from '../standards';
import { createProgram, readInput, resolveSelection } from './index';

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

// Users start at the root `--help` (issue #185), so it must lead to the
// `validate` options rather than dead-end at a bare command list.
describe('createProgram', () => {
  const program = () => createProgram({ name: 'don-checker', standards });

  // Runs the program like the bin does and returns what commander wrote to stderr.
  const parseError = (argv: string[]): string => {
    let stderr = '';
    const root = program();
    for (const command of [root, ...root.commands]) {
      command.exitOverride().configureOutput({ writeErr: text => (stderr += text) });
    }
    expect(() => root.parse(argv, { from: 'user' })).toThrow();
    return stderr;
  };

  it('describes validate and points to its options from the root help', () => {
    // `outputHelp` (unlike `helpInformation`) includes the `addHelpText` sections.
    let help = '';
    program()
      .configureOutput({ writeOut: text => (help += text) })
      .outputHelp();

    expect(help).toMatch(/validate \[options\]\s+Validate a document against a standard/);
    expect(help).toContain('$ don-checker validate --standard adr --input ./document.json');
    // The default version, not a `<id>` placeholder, so the example runs when copied.
    expect(help).toContain('--standard adr --version 2.1 --input');
    expect(help).toContain("Run 'don-checker validate --help' for all options.");
  });

  it('lists every validate option in the validate help', () => {
    const validate = program().commands.find(command => command.name() === 'validate')!;
    const help = validate.helpInformation();

    for (const flag of [
      '--standard <slug>',
      '--version <id>',
      '--ruleset <slug>',
      '--input <file|url|->',
      '--format <fmt>',
      '--fail-on <level>',
    ]) {
      expect(help).toContain(flag);
    }
    expect(help).toContain('available: adr');
  });

  it('hints at --help after an unknown option on validate', () => {
    expect(parseError(['validate', '--bogus'])).toMatch(/unknown option '--bogus'[\s\S]*run with --help for usage/);
  });
});

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

// The source is what lets OpenLint resolve a document's external `$ref`s against
// the document's own location rather than the process CWD.
describe('readInput', () => {
  const originalFetch = globalThis.fetch;
  let dir: string;
  let spec: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'standards-checker-cli-'));
    spec = join(dir, 'spec.json');
    writeFileSync(spec, '{"title":"ok"}');
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns a file input with its absolute path as source', async () => {
    expect(await readInput(spec)).toEqual({ content: '{"title":"ok"}', source: spec });
  });

  it('resolves a relative path against the CWD for the source', async () => {
    expect(await readInput(relative(process.cwd(), spec))).toEqual({ content: '{"title":"ok"}', source: spec });
  });

  it('throws for a missing file', async () => {
    await expect(readInput(join(dir, 'nope.json'))).rejects.toThrow(/Input file not found/);
  });

  it('falls back to the requested URL when the response carries none', async () => {
    globalThis.fetch = vi.fn<typeof fetch>(async () => new Response('{"title":"ok"}', { status: 200 }));

    expect(await readInput('https://example.test/spec.json')).toEqual({
      content: '{"title":"ok"}',
      source: 'https://example.test/spec.json',
    });
  });

  it('prefers the response URL so a redirect rebases relative $refs', async () => {
    globalThis.fetch = vi.fn<typeof fetch>(async () => {
      const response = new Response('{"title":"ok"}', { status: 200 });
      // `Response.url` is read-only and empty on a hand-built response; a real
      // redirected fetch reports the final URL here.
      Object.defineProperty(response, 'url', { value: 'https://cdn.example.test/v2/spec.json' });
      return response;
    });

    const { source } = await readInput('https://example.test/spec.json');
    expect(source).toBe('https://cdn.example.test/v2/spec.json');
  });

  it('leaves the source unset for stdin', async () => {
    const stdin = Readable.from(['{"title":"ok"}']) as unknown as typeof process.stdin;
    vi.spyOn(process, 'stdin', 'get').mockReturnValue(stdin);

    expect(await readInput('-')).toEqual({ content: '{"title":"ok"}' });
  });
});
