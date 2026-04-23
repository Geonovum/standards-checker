import { json, jsonParseLinter } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { linter } from '@codemirror/lint';
import type { ISpectralDiagnostic } from '@stoplight/spectral-core';
import type { Extension, Text } from '@uiw/react-codemirror';

export interface ViolationRange {
  from: number;
  to: number;
}

export interface UiEncodingExtras {
  languageExtensions: Extension[];
  mapViolationRange?(doc: Text, violation: ISpectralDiagnostic, content: string): ViolationRange;
}

const DEFAULT_RANGE_MAPPER = (doc: Text, violation: ISpectralDiagnostic): ViolationRange => ({
  from: doc.line(violation.range.start.line + 1).from + violation.range.start.character,
  to: doc.line(violation.range.end.line + 1).from + violation.range.end.character,
});

interface YamlPathEntry {
  line: number;
  indent: number;
}

// Block-style only: flow mappings (`{a: 1}`), multi-line scalars (`|`, `>`), and
// quoted keys containing `:` fall through to the first-line fallback in yamlRangeMapper.
const buildYamlPathLines = (content: string): Map<string, YamlPathEntry> => {
  const lines = content.split('\n');
  const result = new Map<string, YamlPathEntry>();
  const stack: { indent: number; key: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*)(?:-\s+)?(?:(?:"([^"]*)")|(?:'([^']*)')|([^"':\s#][^:#]*))\s*:/);
    if (!match) continue;

    const indent = match[1].length;
    const key = (match[2] ?? match[3] ?? match[4]).trim();

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    stack.push({ indent, key });
    result.set(stack.map(s => s.key).join('\0'), { line: i, indent });
  }

  return result;
};

const yamlRangeMapper = (doc: Text, violation: ISpectralDiagnostic, content: string): ViolationRange => {
  const lines = content.split('\n');
  const pathLines = buildYamlPathLines(content);
  const keys = violation.path.map(p => String(p));

  for (let len = keys.length; len > 0; len--) {
    const entry = pathLines.get(keys.slice(0, len).join('\0'));
    if (entry === undefined) continue;

    const from = doc.line(entry.line + 1).from;

    let endLine = entry.line;
    for (let i = entry.line + 1; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      if (trimmed === '' || trimmed.startsWith('#')) continue;
      if (lines[i].search(/\S/) <= entry.indent) break;
      endLine = i;
    }

    return { from, to: doc.line(endLine + 1).to };
  }

  const line = doc.line(1);
  return { from: line.from, to: line.to };
};

export const UI_ENCODING_EXTRAS: Record<string, UiEncodingExtras> = {
  json: { languageExtensions: [json(), linter(jsonParseLinter())] },
  yaml: { languageExtensions: [yaml()], mapViolationRange: yamlRangeMapper },
};

export const getRangeMapper = (encodingId: string) => UI_ENCODING_EXTRAS[encodingId]?.mapViolationRange ?? DEFAULT_RANGE_MAPPER;

export const getLanguageExtensions = (encodingId: string): Extension[] =>
  UI_ENCODING_EXTRAS[encodingId]?.languageExtensions ?? UI_ENCODING_EXTRAS.json.languageExtensions;
