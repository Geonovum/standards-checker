import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/ui/vitest-setup.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
});
