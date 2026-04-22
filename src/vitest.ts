import { defineConfig, mergeConfig, type ViteUserConfigExport } from 'vitest/config';

const sharedConfig = defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['@geonovum/standards-checker/vitest-matchers'],
    // Force Vite to transform all node_modules imports (including our shipped
    // re-export files in dist) so CJS named exports from @stoplight/spectral-*
    // are correctly interop'd. Without this, vitest hands files in node_modules
    // to Node's native ESM loader which errors on `export { X } from 'cjs-pkg'`.
    server: {
      deps: {
        inline: true,
      },
    },
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
