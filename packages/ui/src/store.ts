import { create } from 'zustand';
import type { SpecLinter } from './types';

interface CheckerState {
  content: string;
  setContent: (content: string) => void;
  contentFromUrl: boolean;
  setContentFromUrl: (fromUrl: boolean) => void;
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
  contentFromUrl: false,
  setContentFromUrl: contentFromUrl => set({ contentFromUrl }),
  linters: [],
  setLinters: linters => set({ linters }),
  checking: false,
  setChecking: checking => set({ checking }),
  setError: error => set({ error }),
}));
