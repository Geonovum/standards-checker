import { create } from 'zustand';
export const useChecker = create(set => ({
    content: '{}',
    setContent: content => set({ content }),
    linters: [],
    setLinters: linters => set({ linters }),
    checking: false,
    setChecking: checking => set({ checking }),
    setError: error => set({ error }),
}));
