import { defineConfig, mergeConfig, type ViteUserConfigExport } from 'vitest/config';

const sharedConfig = defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['@geonovum/standards-checker/vitest-matchers'],
  },
});

/**
 * Create a Vitest configuration for a standards-checker app.
 *
 * Usage in your vitest.config.ts:
 *   import { createVitestConfig } from '@geonovum/standards-checker/vitest';
 *   export default createVitestConfig({ test: { environment: 'jsdom' } });
 */
export function createVitestConfig(overrides: Record<string, unknown> = {}): ViteUserConfigExport {
  return defineConfig(mergeConfig(sharedConfig, overrides));
}

export default sharedConfig;
