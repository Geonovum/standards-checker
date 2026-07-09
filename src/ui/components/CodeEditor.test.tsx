import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChecker } from '../store';
import CodeEditor from './CodeEditor';

// The real editor is a heavy CodeMirror instance that would kick off async
// linting; stub it so these tests exercise only the result-panel branching
// (loading vs. no-matching-rulesets vs. per-conformance-class results).
vi.mock('@uiw/react-codemirror', () => ({
  default: () => null,
  EditorSelection: { single: () => ({}) },
}));

const conformanceClass = { name: 'test', href: 'https://example.com/conf', extension: [] };

beforeEach(() => {
  useChecker.setState({ content: '{}', conformanceClasses: [conformanceClass], checking: true, error: undefined });
});

afterEach(cleanup);

describe('CodeEditor result panel', () => {
  it('shows the loading indicator (not the results) while a validation is in flight', () => {
    useChecker.setState({ checking: true, conformanceClasses: [conformanceClass] });
    render(<CodeEditor />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    // The per-conformance-class result (its source link) must not render yet.
    expect(screen.queryByRole('link', { name: 'test' })).not.toBeInTheDocument();
  });

  it('shows the per-conformance-class result once checking completes', () => {
    useChecker.setState({ checking: false, conformanceClasses: [conformanceClass] });
    render(<CodeEditor />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'test' })).toBeInTheDocument();
  });

  it('shows "no matching rulesets" (never loading) when there are no conformanceClasses', () => {
    useChecker.setState({ checking: true, conformanceClasses: [] });
    render(<CodeEditor />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('No matching rulesets found.')).toBeInTheDocument();
  });

  it('renders a non-URL conformance class as plain bracketed text, not a link', () => {
    useChecker.setState({ checking: false, conformanceClasses: [{ name: 'plain-class', extension: [] }] });
    const { container } = render(<CodeEditor />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.textContent).toContain('[plain-class]');
  });
});
