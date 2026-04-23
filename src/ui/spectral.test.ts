import { forEachDiagnostic, forceLinting } from '@codemirror/lint';
import type { RulesetDefinition } from '@stoplight/spectral-core';
import { truthy } from '@stoplight/spectral-functions';
import { EditorState, EditorView } from '@uiw/react-codemirror';
import { describe, expect, it } from 'vitest';
import { spectralLinter } from './spectral';

const ruleset: RulesetDefinition = {
  rules: {
    'must-have-title': {
      given: '$',
      severity: 'error',
      then: { field: 'title', function: truthy },
      message: 'Document must have a title.',
    },
  },
};

const runLinter = async (content: string): Promise<{ from: number; to: number; message: string }[]> => {
  const view = new EditorView({
    state: EditorState.create({
      doc: content,
      extensions: [spectralLinter('test', ruleset)],
    }),
    parent: document.body,
  });

  forceLinting(view);
  await new Promise(resolve => setTimeout(resolve, 200));

  const diagnostics: { from: number; to: number; message: string }[] = [];
  forEachDiagnostic(view.state, d => {
    diagnostics.push({ from: d.from, to: d.to, message: d.message });
  });
  view.destroy();
  return diagnostics;
};

describe('spectralLinter', () => {
  it('lints JSON content and reports a diagnostic for the missing-title rule', async () => {
    const diags = await runLinter('{\n  "description": "no title"\n}');
    expect(diags.some(d => d.message.includes('must-have-title'))).toBe(true);
  });

  it('lints block-style YAML content with the same rule', async () => {
    const diags = await runLinter('description: no title\n');
    expect(diags.some(d => d.message.includes('must-have-title'))).toBe(true);
  });

  it('lints flow-style YAML that the old char-sniff would misclassify', async () => {
    const diags = await runLinter('{description: no title}');
    expect(diags.some(d => d.message.includes('must-have-title'))).toBe(true);
  });

  it('produces no diagnostic when the rule is satisfied (YAML)', async () => {
    const diags = await runLinter('title: ok\n');
    expect(diags.some(d => d.message.includes('must-have-title'))).toBe(false);
  });

  it('produces no diagnostic when the rule is satisfied (JSON)', async () => {
    const diags = await runLinter('{"title": "ok"}');
    expect(diags.some(d => d.message.includes('must-have-title'))).toBe(false);
  });
});
