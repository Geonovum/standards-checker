import { describe, expect, it } from 'vitest';
import { ENCODINGS, convertContent, detectEncoding, jsonEncoding, yamlEncoding } from './encodings';

describe('detectEncoding', () => {
  it('classifies an object JSON document', () => {
    expect(detectEncoding('{"a":1}').id).toBe('json');
  });

  it('classifies an array JSON document', () => {
    expect(detectEncoding('[1, 2, 3]').id).toBe('json');
  });

  it('classifies block-style YAML', () => {
    expect(detectEncoding('a: 1\nb: 2\n').id).toBe('yaml');
  });

  it('classifies flow-style YAML that is not valid JSON', () => {
    expect(detectEncoding('{a: 1}').id).toBe('yaml');
  });

  it('classifies a scalar JSON value', () => {
    expect(detectEncoding('42').id).toBe('json');
  });

  it('classifies a quoted scalar as JSON', () => {
    expect(detectEncoding('"hello"').id).toBe('json');
  });

  it('ignores leading whitespace', () => {
    expect(detectEncoding('   \n  {"a":1}  ').id).toBe('json');
  });

  it('strips a leading UTF-8 BOM before classifying', () => {
    expect(detectEncoding('﻿{"a":1}').id).toBe('json');
    expect(detectEncoding('﻿a: 1\n').id).toBe('yaml');
  });

  it('falls back to the first registered encoding for empty input', () => {
    expect(detectEncoding('').id).toBe(ENCODINGS[0].id);
  });

  it('falls back to the first registered encoding for unparseable input', () => {
    expect(detectEncoding('::: @@ $$ not any format').id).toBe(ENCODINGS[0].id);
  });

  it('honors a custom encoding order', () => {
    expect(detectEncoding('{"a":1}', [yamlEncoding, jsonEncoding]).id).toBe('yaml');
  });
});

describe('encoding registry', () => {
  it('lists JSON first so JSON inputs are not misclassified as YAML', () => {
    expect(ENCODINGS[0].id).toBe('json');
  });

  it('exposes a label for each encoding', () => {
    expect(ENCODINGS.map(e => e.label)).toEqual(['JSON', 'YAML']);
  });
});

describe('convertContent', () => {
  it('is identity for same-encoding conversions', () => {
    const source = '{"a":1}';
    expect(convertContent(jsonEncoding, jsonEncoding, source)).toBe(source);
  });

  it('round-trips a JSON object through YAML', () => {
    const json = '{"a":1,"b":[2,3]}';
    const yaml = convertContent(jsonEncoding, yamlEncoding, json);
    expect(convertContent(yamlEncoding, jsonEncoding, yaml)).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it('throws on malformed source content', () => {
    expect(() => convertContent(jsonEncoding, yamlEncoding, 'not json at all')).toThrow(/JSON parse error/);
  });
});

describe('canonicalize', () => {
  it('pretty-prints JSON', () => {
    expect(jsonEncoding.canonicalize?.('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it('leaves YAML untouched (no canonicalize)', () => {
    expect(yamlEncoding.canonicalize).toBeUndefined();
  });
});
