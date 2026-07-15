import { cleanup, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Standard, StandardVersion, VersionStatus } from '../standards';
import { buildRoutes } from './router';

// Render the real route table (built by buildRoutes) over an in-memory history
// so we can assert where legacy/bare URLs land. The canonical version routes
// render <App>; stub it so we don't spin up the editor.
vi.mock('./App', () => ({ default: () => <div>app</div> }));

const version = (id: string, status: VersionStatus, legacySlug: string): StandardVersion => ({
  id,
  label: id,
  status,
  example: '{}',
  rulesets: {},
  legacySlug,
});

const adr: Standard = {
  name: 'API Design Rules',
  slug: 'adr',
  versions: [
    version('2.0', 'final', 'adr-20'),
    version('2.1', 'final', 'adr-21'),
    version('consultatie', 'draft', 'adr-consult'),
    version('werkversie', 'draft', 'adr'),
  ],
};
const publiccode: Standard = { name: 'publiccode.yml', slug: 'publiccode', versions: [version('0.5', 'final', 'publiccode-05')] };
// OGC-style: the standard slug equals its single version's legacy slug.
const jsonFg: Standard = { name: 'JSON-FG', slug: 'json-fg', versions: [version('1.0', 'final', 'json-fg')] };
const standards = [adr, publiccode, jsonFg];

function landOn(initialEntry: string) {
  const router = createMemoryRouter(buildRoutes(standards), { initialEntries: [initialEntry] });
  render(<RouterProvider router={router} />);
  return router;
}

afterEach(cleanup);

describe('URL routing', () => {
  it('redirects root to the first standard default version', async () => {
    const router = landOn('/');
    await waitFor(() => expect(router.state.location.pathname).toBe('/adr/2.1'));
  });

  it.each([
    ['/adr-20', '/adr/2.0'],
    ['/adr-21', '/adr/2.1'],
    ['/adr-consult', '/adr/consultatie'],
    ['/adr', '/adr/werkversie'], // legacy Werkversie URL preserved, not the 2.1 default
    ['/publiccode-05', '/publiccode/0.5'],
    ['/json-fg', '/json-fg/1.0'],
  ])('redirects legacy slug %s to %s', async (from, to) => {
    const router = landOn(from);
    await waitFor(() => expect(router.state.location.pathname).toBe(to));
  });

  it('redirects a bare standard slug to its default version', async () => {
    const router = landOn('/publiccode');
    await waitFor(() => expect(router.state.location.pathname).toBe('/publiccode/0.5'));
  });

  it('redirects an unknown slug to the first standard default version', async () => {
    const router = landOn('/nope');
    await waitFor(() => expect(router.state.location.pathname).toBe('/adr/2.1'));
  });

  it('redirects an unknown version under a known standard to its default, not a colliding legacy slug', async () => {
    // `adr` is also werkversie's legacySlug, but a stale/mistyped version under
    // it must land on the default (2.1), not on the werkversie draft.
    const router = landOn('/adr/9.9');
    await waitFor(() => expect(router.state.location.pathname).toBe('/adr/2.1'));
  });

  it('serves a canonical /{standard}/{version} URL as-is', async () => {
    const router = landOn('/adr/consultatie');
    await waitFor(() => expect(router.state.location.pathname).toBe('/adr/consultatie'));
  });

  it('preserves ?url= across a legacy redirect', async () => {
    const router = landOn('/adr-20?url=https://example.com/x.json');
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/adr/2.0');
      expect(router.state.location.search).toBe('?url=https://example.com/x.json');
    });
  });

  it('throws a clear error when built with no standards', () => {
    expect(() => buildRoutes([])).toThrow(/at least one standard/);
  });
});
