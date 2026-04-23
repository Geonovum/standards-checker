import type { ISpectralDiagnostic } from '@stoplight/spectral-core';
import { DiagnosticSeverity } from '@stoplight/types';
import { Text } from '@uiw/react-codemirror';
import { describe, expect, it } from 'vitest';
import { UI_ENCODING_EXTRAS, getLanguageExtensions, getRangeMapper } from './encodings';

const violation = (overrides: Partial<ISpectralDiagnostic>): ISpectralDiagnostic => ({
  code: 'some-rule',
  message: 'x',
  severity: DiagnosticSeverity.Error,
  path: [],
  source: 'test',
  range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
  ...overrides,
});

describe('getLanguageExtensions', () => {
  it('returns the json-specific extensions for json', () => {
    expect(getLanguageExtensions('json')).toBe(UI_ENCODING_EXTRAS.json.languageExtensions);
  });

  it('returns the yaml-specific extensions for yaml', () => {
    expect(getLanguageExtensions('yaml')).toBe(UI_ENCODING_EXTRAS.yaml.languageExtensions);
  });

  it('falls back to json extensions for an unknown encoding id', () => {
    expect(getLanguageExtensions('toml-not-registered')).toBe(UI_ENCODING_EXTRAS.json.languageExtensions);
  });
});

describe('getRangeMapper — json', () => {
  it("uses Spectral's reported range verbatim", () => {
    const content = '{\n  "title": "missing"\n}';
    const doc = Text.of(content.split('\n'));
    const mapper = getRangeMapper('json');
    const range = mapper(
      doc,
      violation({
        path: ['title'],
        range: { start: { line: 1, character: 2 }, end: { line: 1, character: 9 } },
      }),
      content,
    );
    expect(content.slice(range.from, range.to)).toBe('"title"');
  });
});

describe('getRangeMapper — yaml', () => {
  it('covers a top-level key line', () => {
    const content = 'name: ogc\nversion: 1\n';
    const doc = Text.of(content.split('\n'));
    const mapper = getRangeMapper('yaml');
    const range = mapper(doc, violation({ path: ['name'] }), content);
    expect(content.slice(range.from, range.to)).toBe('name: ogc');
  });

  it('covers a nested key through the end of its value block', () => {
    const content = ['info:', '  title: foo', '  version: 1', 'paths:', '  /a:', '    get: bar'].join('\n') + '\n';
    const doc = Text.of(content.split('\n'));
    const mapper = getRangeMapper('yaml');
    const range = mapper(doc, violation({ path: ['info'] }), content);
    const selected = content.slice(range.from, range.to);
    expect(selected).toContain('info:');
    expect(selected).toContain('title: foo');
    expect(selected).toContain('version: 1');
    expect(selected).not.toContain('paths:');
  });

  it('falls back to the longest matching path prefix', () => {
    const content = 'info:\n  title: foo\n';
    const doc = Text.of(content.split('\n'));
    const mapper = getRangeMapper('yaml');
    const range = mapper(doc, violation({ path: ['info', 'title', 'not-real'] }), content);
    expect(content.slice(range.from, range.to)).toContain('title: foo');
  });

  it('falls back to the first line when no path segment matches', () => {
    const content = 'name: ogc\n';
    const doc = Text.of(content.split('\n'));
    const mapper = getRangeMapper('yaml');
    const range = mapper(doc, violation({ path: ['nonexistent'] }), content);
    expect(range.from).toBe(0);
    expect(range.to).toBe(doc.line(1).to);
  });
});
