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

const standardA: Standard = { name: 'A', slug: 'a', versions: [version('1.0', 'A 1.0 example'), version('2.0', 'A 2.0 example')] };
const standardB: Standard = { name: 'B', slug: 'b', versions: [version('1.0', 'B 1.0 example')] };
const standards = [standardA, standardB];

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
  useChecker.setState({ content: '{}', pristineExample: '{}', linters: [], activeStandard: undefined });
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
});
