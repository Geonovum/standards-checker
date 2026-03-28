import { linter } from '@codemirror/lint';
import * as SpectralCore from '@stoplight/spectral-core';
import type { RulesetDefinition } from '@stoplight/spectral-core';
import * as Parsers from '@stoplight/spectral-parsers';
import { DiagnosticSeverity } from '@stoplight/types';
import type { Text } from '@uiw/react-codemirror';
import type { Extension } from '@uiw/react-codemirror';
import type { Severity } from './types';

type SpectralCoreModule = typeof import('@stoplight/spectral-core');
type SpectralParsersModule = typeof import('@stoplight/spectral-parsers');

const spectralCore =
  (SpectralCore as unknown as { default?: SpectralCoreModule }).default ?? (SpectralCore as unknown as SpectralCoreModule);
const parsers = (Parsers as unknown as { default?: SpectralParsersModule }).default ?? (Parsers as unknown as SpectralParsersModule);

const { Document, Spectral } = spectralCore;
const { Json, Yaml } = parsers;

const isJsonContent = (content: string): boolean => {
  const trimmed = content.trimStart();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
};

export interface Rulesets {
  [confClass: string]: RulesetDefinition;
}

const mapSeverity = (severity: DiagnosticSeverity): Severity => {
  switch (severity) {
    case DiagnosticSeverity.Warning:
      return 'warning';
    case DiagnosticSeverity.Information:
      return 'info';
    case DiagnosticSeverity.Hint:
      return 'hint';
    default:
      return 'error';
  }
};

/**
 * Build a map from YAML key paths to line numbers using indentation tracking.
 */
interface YamlPathEntry {
  line: number;
  indent: number;
}

function buildYamlPathLines(content: string): Map<string, YamlPathEntry> {
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
}

/**
 * Find the range of a violation path in YAML content by matching path segments
 * against the YAML key structure. The range spans from the key line to the end
 * of its value (the last line before the next sibling or parent key).
 */
function findYamlPosition(doc: Text, path: (string | number)[], pathLines: Map<string, YamlPathEntry>, lines: string[]): { from: number; to: number } {
  const keys = path.map(p => String(p));

  for (let len = keys.length; len > 0; len--) {
    const entry = pathLines.get(keys.slice(0, len).join('\0'));
    if (entry === undefined) continue;

    const from = doc.line(entry.line + 1).from;

    // Find the end: scan forward for the next line at same or lesser indentation
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
}

export const spectralLinter = (name: string, ruleset: RulesetDefinition): Extension => {
  const spectral = new Spectral();

  spectral.setRuleset(ruleset);

  return linter(async view => {
    const doc = view.state.doc;
    const editorContent = doc.toString();
    const isJson = isJsonContent(editorContent);
    const parser = isJson ? Json : Yaml;
    const document = new Document(editorContent, parser as typeof Json);
    const violations = await spectral.run(document);

    if (isJson) {
      return violations
        .map(violation => ({
          source: name,
          from: doc.line(violation.range.start.line + 1).from + violation.range.start.character,
          to: doc.line(violation.range.end.line + 1).from + violation.range.end.character,
          severity: mapSeverity(violation.severity),
          message: `[${violation.code}] ${violation.message}`,
          documentationUrl: violation.documentationUrl,
        }));
    }

    // For YAML: use path-based position mapping (Spectral's YAML positions are unreliable)
    const lines = editorContent.split('\n');
    const pathLines = buildYamlPathLines(editorContent);

    return violations
      .map(violation => {
        const pos = findYamlPosition(doc, violation.path, pathLines, lines);
        return {
          source: name,
          from: pos.from,
          to: pos.to,
          severity: mapSeverity(violation.severity),
          message: `[${violation.code}] ${violation.message}`,
          documentationUrl: violation.documentationUrl,
        };
      });
  });
};
