import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useChecker } from '../store';
import FormatToggle from './FormatToggle';

const resetStore = (content: string) => {
  act(() => {
    useChecker.setState({ content });
  });
};

describe('<FormatToggle />', () => {
  beforeEach(() => {
    resetStore('{"a":1}');
  });

  afterEach(() => {
    cleanup();
    resetStore('{}');
  });

  it('renders one pill per registered encoding', () => {
    render(<FormatToggle />);
    expect(screen.getByRole('radio', { name: 'JSON' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'YAML' })).toBeInTheDocument();
  });

  it('marks the encoding matching the current content as active', () => {
    render(<FormatToggle />);
    expect(screen.getByRole('radio', { name: 'JSON' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'YAML' })).toHaveAttribute('aria-checked', 'false');
  });

  it('keeps every pill clickable (no disabled state on the active one)', () => {
    render(<FormatToggle />);
    expect(screen.getByRole('radio', { name: 'JSON' })).not.toBeDisabled();
    expect(screen.getByRole('radio', { name: 'YAML' })).not.toBeDisabled();
  });

  it('converts JSON content to YAML when the YAML pill is clicked', async () => {
    const user = userEvent.setup();
    render(<FormatToggle />);

    await user.click(screen.getByRole('radio', { name: 'YAML' }));
    const updated = useChecker.getState().content;
    expect(updated).toContain('a: 1');
    expect(updated).not.toContain('{');
  });

  it('converts YAML content to JSON when the JSON pill is clicked', async () => {
    resetStore('a: 1\n');
    const user = userEvent.setup();
    render(<FormatToggle />);

    expect(screen.getByRole('radio', { name: 'YAML' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('radio', { name: 'JSON' }));
    expect(useChecker.getState().content).toBe('{\n  "a": 1\n}');
  });

  it('shifts the active indicator after a conversion', async () => {
    const user = userEvent.setup();
    render(<FormatToggle />);

    await user.click(screen.getByRole('radio', { name: 'YAML' }));
    expect(screen.getByRole('radio', { name: 'YAML' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'JSON' })).toHaveAttribute('aria-checked', 'false');
  });

  it('is a no-op when the active pill is clicked', async () => {
    const user = userEvent.setup();
    render(<FormatToggle />);

    const before = useChecker.getState().content;
    await user.click(screen.getByRole('radio', { name: 'JSON' }));
    expect(useChecker.getState().content).toBe(before);
  });
});
