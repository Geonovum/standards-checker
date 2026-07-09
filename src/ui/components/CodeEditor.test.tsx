import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChecker } from '../store';
import CodeEditor from './CodeEditor';

// The real editor is a heavy CodeMirror instance that would kick off async
// linting; stub it so these tests exercise only the result-panel branching
// (loading vs. no-matching-rulesets vs. per-linter results).
vi.mock('@uiw/react-codemirror', () => ({
  default: () => null,
  EditorSelection: { single: () => ({}) },
}));

const linter = { name: 'test', href: 'https://example.com/conf', linter: [] };

beforeEach(() => {
  useChecker.setState({ content: '{}', linters: [linter], checking: true, error: undefined });
});

afterEach(cleanup);

describe('CodeEditor result panel', () => {
  it('shows the loading indicator (not the results) while a validation is in flight', () => {
    useChecker.setState({ checking: true, linters: [linter] });
    render(<CodeEditor />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    // The per-linter result (its source link) must not render yet.
    expect(screen.queryByRole('link', { name: 'test' })).not.toBeInTheDocument();
  });

  it('shows the per-linter result once checking completes', () => {
    useChecker.setState({ checking: false, linters: [linter] });
    render(<CodeEditor />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'test' })).toBeInTheDocument();
  });

  it('shows "no matching rulesets" (never loading) when there are no linters', () => {
    useChecker.setState({ checking: true, linters: [] });
    render(<CodeEditor />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('No matching rulesets found.')).toBeInTheDocument();
  });
});
