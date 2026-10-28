import * as OpenLintCore from '@openlint/openlint-core';
import type { IParser } from '@openlint/openlint-parsers';
import * as Parsers from '@openlint/openlint-parsers';
import { dump } from 'js-yaml';

type OpenLintCoreModule = typeof import('@openlint/openlint-core');
type OpenLintParsersModule = typeof import('@openlint/openlint-parsers');

const openLintCore =
  (OpenLintCore as unknown as { default?: OpenLintCoreModule }).default ?? (OpenLintCore as unknown as OpenLintCoreModule);
const parsers = (Parsers as unknown as { default?: OpenLintParsersModule }).default ?? (Parsers as unknown as OpenLintParsersModule);

export const { Document, OpenLint } = openLintCore;
/** @deprecated Use `OpenLint`. Removed in the next major. */
export const Spectral = OpenLint;
export const { Json, Yaml } = parsers;

// IParser is invariant in its generic R, so the common supertype of IParser<JsonParserResult>
// and IParser<YamlParserResult> is IParser<any>. The concrete shape is recovered at
// `new Document(content, encoding.parser)` via Document's own generic inference.
export type EncodingParser = IParser<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface Encoding {
  id: string;
  label: string;
  parser: EncodingParser;
  stringify(value: unknown): string;
  canonicalize?(content: string): string;
}

const tryParse = (encoding: Encoding, content: string): boolean => encoding.parser.parse(content).diagnostics.length === 0;

export const jsonEncoding: Encoding = {
  id: 'json',
  label: 'JSON',
  parser: Json,
  stringify: value => JSON.stringify(value, null, 2),
  canonicalize: content => JSON.stringify(JSON.parse(content), null, 2),
};

export const yamlEncoding: Encoding = {
  id: 'yaml',
  label: 'YAML',
  parser: Yaml,
  stringify: value => dump(value, { lineWidth: -1, noRefs: true }),
};

// Order matters: JSON must precede YAML. JSON is a strict YAML subset, so JSON
// content also parses cleanly as YAML — the first match wins in detectEncoding.
export const ENCODINGS: readonly Encoding[] = [jsonEncoding, yamlEncoding];

export const detectEncoding = (content: string, encodings: readonly Encoding[] = ENCODINGS): Encoding => {
  const stripped = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  if (stripped.trim() === '') return encodings[0];
  for (const encoding of encodings) {
    if (tryParse(encoding, stripped)) return encoding;
  }
  return encodings[0];
};

export const convertContent = (from: Encoding, to: Encoding, content: string): string => {
  if (from.id === to.id) return content;
  const parsed = from.parser.parse(content);
  if (parsed.diagnostics.length > 0) {
    throw new Error(`${from.label} parse error`);
  }
  return to.stringify(parsed.data);
};
