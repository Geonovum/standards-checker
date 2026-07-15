import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import type { Standard, StandardVersion } from '../../standards';
import VersionSelector from './VersionSelector';

const version = (id: string): StandardVersion => ({ id, label: id, status: 'final', example: '{}', rulesets: {} });

const standard: Standard = { name: 'A', slug: 'a', versions: [version('1.0'), version('2.0')] };

function renderSelector(initialEntry: string) {
  const router = createMemoryRouter([{ path: '*', element: <VersionSelector standard={standard} version={standard.versions[0]} /> }], {
    initialEntries: [initialEntry],
  });
  render(<RouterProvider router={router} />);
  return router;
}

afterEach(cleanup);

describe('VersionSelector', () => {
  it('navigates to the chosen version, preserving ?url=', async () => {
    const router = renderSelector('/a/1.0?url=https://example.com/x.json');

    await userEvent.selectOptions(screen.getByRole('combobox'), '2.0');

    expect(router.state.location.pathname).toBe('/a/2.0');
    expect(router.state.location.search).toBe('?url=https://example.com/x.json');
  });

  it('lists versions newest-first (config order is reversed)', () => {
    renderSelector('/a/1.0');

    const values = screen.getAllByRole('option').map(option => (option as HTMLOptionElement).value);
    expect(values).toEqual(['2.0', '1.0']);
  });
});
