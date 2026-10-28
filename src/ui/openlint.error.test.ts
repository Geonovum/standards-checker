import { forceLinting } from '@codemirror/lint';
import type { RulesetDefinition } from '@openlint/openlint-core';
import { EditorState, EditorView } from '@uiw/react-codemirror';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Force `openLint.run` to reject so the linter's catch path runs. @codemirror/lint
// only emits `setDiagnosticsEffect` (which clears the `checking` flag / loading
// indicator) when the source resolves, so a rejected run must resolve to an empty
// result rather than leaving the UI spinning. Isolated in its own file so the
// module mock doesn't leak into openlint.test.ts's happy-path suite.
vi.mock('../encodings', async importOriginal => {
  const actual = await importOriginal<typeof import('../encodings')>();
  return {
    ...actual,
    OpenLint: class {
      setRuleset() {}
      run() {
        return Promise.reject(new Error('openlint boom'));
      }
    },
  };
});

const { openLintChecker } = await import('./openlint');

const ruleset = { rules: {} } as RulesetDefinition;

afterEach(() => vi.restoreAllMocks());

describe('openLintChecker (failure path)', () => {
  it('logs and yields no diagnostics instead of hanging when a run rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const view = new EditorView({
      state: EditorState.create({ doc: '{}', extensions: [openLintChecker('boom-class', ruleset)] }),
      parent: document.body,
    });
    forceLinting(view);
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(errorSpy).toHaveBeenCalledWith('[boom-class] validation failed:', expect.any(Error));
    view.destroy();
  });
});
