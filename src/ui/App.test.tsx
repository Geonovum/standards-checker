import type { RulesetDefinition } from '@stoplight/spectral-core';
import { truthy } from '@stoplight/spectral-functions';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Standard, StandardVersion } from '../standards';
import App from './App';
import { resolveVersion } from './resolve';
import { useChecker } from './store';

// This test focuses on the standard/version sync effect; keep the heavy editor
// and the fetch input out of it.
vi.mock('./components/CodeEditor', () => ({ default: () => null }));
vi.mock('./components/UriInput', () => ({ default: () => null }));

const version = (id: string, example: string): StandardVersion => ({ id, label: id, status: 'final', example, rulesets: {} });

const ruleset: RulesetDefinition = {
  rules: { r: { given: '$', severity: 'error', then: { field: 'x', function: truthy }, message: 'needs x' } },
};
// A version WITH a ruleset, so resolveVersion yields a non-empty conformanceClasses
// (needed to exercise the checking re-entry, which is gated on there being
// something to validate).
const versionWithRules = (id: string, example: string): StandardVersion => ({
  id,
  label: id,
  status: 'final',
  example,
  rulesets: { [`http://example.com/${id}/conf/core`]: ruleset },
});

const standardA: Standard = { name: 'A', slug: 'a', versions: [version('1.0', 'A 1.0 example'), version('2.0', 'A 2.0 example')] };
const standardB: Standard = { name: 'B', slug: 'b', versions: [version('1.0', 'B 1.0 example')] };
const standardC: Standard = {
  name: 'C',
  slug: 'c',
  versions: [versionWithRules('1.0', 'C 1.0 example'), versionWithRules('2.0', 'C 2.0 example')],
};
const standards = [standardA, standardB, standardC];

function renderAt(initialEntry: string) {
  const routes = standards.flatMap(standard =>
    standard.versions.map(v => ({
      path: `/${standard.slug}/${v.id}`,
      element: <App resolved={resolveVersion(standard, v)} standards={standards} />,
    })),
  );
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  useChecker.setState({ content: '{}', pristineExample: '{}', conformanceClasses: [], activeStandard: undefined });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('App standard/version sync', () => {
  it('resets content to the addressed version example and records the active standard on first load', async () => {
    renderAt('/a/1.0');

    await waitFor(() => {
      expect(useChecker.getState().content).toBe('A 1.0 example');
      expect(useChecker.getState().activeStandard).toBe('a');
    });
  });

  it('shows the addressed version example on a deep link', async () => {
    renderAt('/a/2.0');

    await waitFor(() => expect(useChecker.getState().content).toBe('A 2.0 example'));
  });

  it('reloads the example when switching version if the editor is untouched', async () => {
    const router = renderAt('/a/1.0');
    await waitFor(() => expect(useChecker.getState().content).toBe('A 1.0 example'));

    // No edits -> switching version reloads the new version's example.
    await act(async () => {
      await router.navigate('/a/2.0');
    });
    await waitFor(() => expect(useChecker.getState().content).toBe('A 2.0 example'));
  });

  it('retains edited content when switching version, resets when switching standard', async () => {
    const router = renderAt('/a/1.0');
    await waitFor(() => expect(useChecker.getState().content).toBe('A 1.0 example'));

    // User edits the document -> it is now dirty.
    act(() => useChecker.getState().setContent('EDITED'));

    // Switch version within the same standard -> dirty content retained.
    await act(async () => {
      await router.navigate('/a/2.0');
    });
    await waitFor(() => expect(useChecker.getState().activeStandard).toBe('a'));
    expect(useChecker.getState().content).toBe('EDITED');

    // Switch standard -> content reset to the new standard's example even when dirty.
    await act(async () => {
      await router.navigate('/b/1.0');
    });
    await waitFor(() => {
      expect(useChecker.getState().content).toBe('B 1.0 example');
      expect(useChecker.getState().activeStandard).toBe('b');
    });
  });

  // The home standard is standards[0] (A); its default version is the latest
  // final, i.e. 2.0 -> 'A 2.0 example'.
  it('resets dirty content when the title is clicked on the home standard', async () => {
    const router = renderAt('/a/2.0');
    await waitFor(() => expect(useChecker.getState().content).toBe('A 2.0 example'));

    act(() => useChecker.getState().setContent('EDITED'));

    await userEvent.click(screen.getByRole('link', { name: 'Checker' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/a/2.0');
      expect(useChecker.getState().content).toBe('A 2.0 example');
    });
  });

  it('navigates to the home standard and resets when the title is clicked elsewhere', async () => {
    const router = renderAt('/b/1.0');
    await waitFor(() => expect(useChecker.getState().content).toBe('B 1.0 example'));

    await userEvent.click(screen.getByRole('link', { name: 'Checker' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/a/2.0');
      expect(useChecker.getState().content).toBe('A 2.0 example');
      expect(useChecker.getState().activeStandard).toBe('a');
    });
  });

  it('re-enters the checking state and clears a stale error on a dirty version switch', async () => {
    const router = renderAt('/c/1.0');
    await waitFor(() => expect(useChecker.getState().content).toBe('C 1.0 example'));

    // A prior validation has finished (checking cleared) with a stale fetch error
    // showing; then the user edits the document so it is dirty.
    act(() => {
      useChecker.setState({ checking: false, error: 'stale error' });
      useChecker.getState().setContent('EDITED');
    });

    await act(async () => {
      await router.navigate('/c/2.0');
    });

    await waitFor(() => {
      // Edits are retained across the version switch (same standard, dirty)...
      expect(useChecker.getState().content).toBe('EDITED');
      // ...but the newly addressed version re-enters checking (so the loading
      // indicator shows instead of false green "no violations" bars) and drops
      // the stale error.
      expect(useChecker.getState().checking).toBe(true);
      expect(useChecker.getState().error).toBeUndefined();
    });
  });

  it('clears a stale error when the title is clicked even if the content does not change', async () => {
    renderAt('/a/2.0');
    await waitFor(() => expect(useChecker.getState().content).toBe('A 2.0 example'));

    // Editor untouched (content already equals the home example); a prior fetch
    // failed, so the error banner is up. The reset lands on identical content, so
    // no editor docChanged fires — loadExample must clear the error itself.
    act(() => useChecker.setState({ error: 'network boom' }));

    await userEvent.click(screen.getByRole('link', { name: 'Checker' }));

    await waitFor(() => expect(useChecker.getState().error).toBeUndefined());
  });
});
