import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import type { Standard, StandardVersion } from '../../standards';
import StandardSelector from './StandardSelector';

const version = (id: string): StandardVersion => ({ id, label: id, status: 'final', example: '{}', rulesets: {} });

const standardA: Standard = { name: 'A', slug: 'a', versions: [version('1.0'), version('2.0')] };
const standardB: Standard = { name: 'B', slug: 'b', versions: [version('0.5')] };
const standards = [standardA, standardB];

function renderSelector() {
  const router = createMemoryRouter([{ path: '*', element: <StandardSelector standards={standards} standard={standardA} /> }], {
    initialEntries: ['/a/2.0?url=https://example.com/x.json'],
  });
  render(<RouterProvider router={router} />);
  return router;
}

afterEach(cleanup);

describe('StandardSelector', () => {
  it('navigates to the chosen standard default version and drops any ?url=', async () => {
    const router = renderSelector();

    await userEvent.selectOptions(screen.getByRole('combobox'), 'b');

    // B's default (latest final) is 0.5; the search-less navigation drops ?url=.
    expect(router.state.location.pathname).toBe('/b/0.5');
    expect(router.state.location.search).toBe('');
  });
});
