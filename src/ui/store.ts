import { create } from 'zustand';
import type { SpecLinter } from './types';

interface CheckerState {
  content: string;
  /**
   * Set the editor content. Leaves `pristineExample` untouched, so any edit
   * (typing, paste, format toggle, `?url=` load) marks the document dirty.
   */
  setContent: (content: string) => void;
  /**
   * The example the current content was loaded from; the baseline for the
   * dirty check (`content !== pristineExample`) that decides retain-vs-reload
   * on a version switch.
   */
  pristineExample: string;
  /** Slug of the standard currently shown; drives the retain/reset decision. */
  activeStandard?: string;
  /**
   * Load an example into the editor and record it as the pristine baseline for
   * `standardSlug`, so the document reads as untouched until the user edits it.
   */
  loadExample: (example: string, standardSlug: string) => void;
  linters: SpecLinter[];
  setLinters: (linters: SpecLinter[]) => void;
  checking: boolean;
  setChecking: (checking: boolean) => void;
  error?: string;
  setError: (error?: string) => void;
}

export const useChecker = create<CheckerState>(set => ({
  content: '{}',
  setContent: content => set({ content }),
  pristineExample: '{}',
  loadExample: (example, standardSlug) => set({ content: example, pristineExample: example, activeStandard: standardSlug }),
  linters: [],
  setLinters: linters => set({ linters }),
  // Start in the checking state: the linter runs asynchronously on mount, so
  // until its first result arrives there are no diagnostics yet — showing the
  // loading indicator (not the "no violations" bar) during that window.
  checking: true,
  setChecking: checking => set({ checking }),
  setError: error => set({ error }),
}));
