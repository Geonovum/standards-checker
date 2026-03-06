import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChecker } from '../store';
import type { Spec } from '../types';
import UriInput from './UriInput';

const spec: Spec = {
  name: 'Test Spec',
  slug: 'test-spec',
  example: '{}',
  linters: [{ name: 'test-linter', linter: [] }],
};

function renderWithRouter(urlSearchParams = '') {
  const router = createMemoryRouter([{ path: '/test-spec', element: <UriInput spec={spec} /> }], {
    initialEntries: [`/test-spec${urlSearchParams}`],
  });

  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  useChecker.setState({ checking: false, error: undefined });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('UriInput', () => {
  it('renders input and load button', () => {
    renderWithRouter();

    expect(screen.getByPlaceholderText(/enter url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
  });

  it('fetches on form submit', async () => {
    const json = JSON.stringify({ hello: 'world' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(json, { status: 200 }));

    renderWithRouter();

    const input = screen.getByPlaceholderText(/enter url/i);
    const button = screen.getByRole('button', { name: /load/i });

    await userEvent.type(input, 'https://example.com/doc.json');
    await userEvent.click(button);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('https://example.com/doc.json');
      expect(useChecker.getState().content).toContain('"hello"');
    });
  });

  it('auto-fetches when url search param is present', async () => {
    const json = JSON.stringify({ auto: true });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(json, { status: 200 }));

    renderWithRouter('?url=https://example.com/auto.json');

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('https://example.com/auto.json');
      expect(useChecker.getState().content).toContain('"auto"');
    });
  });

  it('pre-fills input with url search param', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));

    renderWithRouter('?url=https://example.com/prefilled.json');

    expect(screen.getByPlaceholderText(/enter url/i)).toHaveValue('https://example.com/prefilled.json');
  });

  it('does not auto-fetch without url search param', () => {
    vi.spyOn(globalThis, 'fetch');

    renderWithRouter();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('sets error on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    renderWithRouter('?url=https://example.com/fail.json');

    await waitFor(() => {
      expect(useChecker.getState().error).toMatch(/CORS/);
    });
  });

  it('sets error on non-200 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Not Found', { status: 404 }));

    renderWithRouter('?url=https://example.com/missing.json');

    await waitFor(() => {
      expect(useChecker.getState().error).toBeDefined();
    });
  });

  it('calls responseMapper when defined', async () => {
    const json = JSON.stringify({ raw: true });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(json, { status: 200 }));

    const mappedSpec: Spec = {
      ...spec,
      responseMapper: async () => ({
        content: JSON.stringify({ mapped: true }),
      }),
    };

    const router = createMemoryRouter([{ path: '/test-spec', element: <UriInput spec={mappedSpec} /> }], {
      initialEntries: ['/test-spec?url=https://example.com/mapped.json'],
    });
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(useChecker.getState().content).toContain('"mapped"');
    });
  });

  it('updates url search param after successful fetch', async () => {
    const json = JSON.stringify({ hello: 'world' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(json, { status: 200 }));

    const router = renderWithRouter();

    await userEvent.type(screen.getByPlaceholderText(/enter url/i), 'https://example.com/doc.json');
    await userEvent.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(router.state.location.search).toBe('?url=https%3A%2F%2Fexample.com%2Fdoc.json');
    });
  });

  it('does not update url search param for invalid urls', async () => {
    const json = JSON.stringify({ hello: 'world' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(json, { status: 200 }));

    const router = renderWithRouter();

    await userEvent.type(screen.getByPlaceholderText(/enter url/i), 'not-a-url');
    await userEvent.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(useChecker.getState().content).toContain('"hello"');
    });
    expect(router.state.location.search).toBe('');
  });

  it('disables button while checking', () => {
    useChecker.setState({ checking: true });

    renderWithRouter();

    expect(screen.getByRole('button', { name: /load/i })).toBeDisabled();
  });
});
