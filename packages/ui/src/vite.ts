import { createRequire } from 'module';
import react from '@vitejs/plugin-react';
import yaml from '@modyfi/vite-plugin-yaml';

const _require = createRequire(import.meta.url);

/**
 * Vite plugin that resolves peer dependencies from this package's node_modules.
 * When standards-checker-ui is linked (via pnpm link/overrides), the pre-built
 * dist files import packages like zustand, clsx, etc. Vite's standard resolver
 * can't find these in the consumer's node_modules (pnpm strict mode). This
 * plugin resolves them from the UI package's own node_modules as a fallback.
 */
function resolveLinkedDeps(): Record<string, unknown> {
  return {
    name: 'resolve-linked-deps',
    async resolveId(
      this: { resolve: (source: string, importer?: string, options?: Record<string, unknown>) => Promise<unknown> },
      source: string,
      importer: string | undefined,
      options: Record<string, unknown>,
    ) {
      if (!source || source.startsWith('.') || source.startsWith('/') || source.startsWith('\0')) return null;
      if (!importer || !importer.includes('/standards-checker/')) return null;
      // Let Vite's default resolver try first — this ensures packages the consumer
      // has installed (react, react-router-dom, etc.) resolve to a single copy.
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (resolved) return null;
      // Fallback: resolve from the UI package's own node_modules for peer deps
      // that the consumer doesn't have installed (clsx, zustand, lucide-react, etc.)
      try {
        return _require.resolve(source);
      } catch {
        return null;
      }
    },
  };
}

/**
 * Shared Vite configuration for standards-checker apps.
 *
 * Usage in your vite.config.ts:
 *   import { sharedConfig } from '@geonovum/standards-checker-ui/vite';
 *   import { defineConfig, mergeConfig } from 'vitest/config';
 *   export default defineConfig(mergeConfig(sharedConfig, { base: '/my-app/' }));
 */
export const sharedConfig: Record<string, unknown> = {
  plugins: [react(), yaml(), resolveLinkedDeps()],
  build: {
    outDir: 'docs',
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('/spectral-') || id.includes('/ajv') || id.includes('/better-ajv-errors/') || id.includes('/nimma/'))
            return 'spectral';
          if (id.includes('/codemirror/') || id.includes('/@uiw/')) return 'codemirror';
        },
      },
      onLog(level: string, log: { message?: string }, defaultHandler: (level: string, log: unknown) => void) {
        if (log.message?.includes('has been externalized for browser compatibility')) return;
        defaultHandler(level, log);
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom', 'zustand'],
  },
  test: {
    environment: 'node',
    setupFiles: ['src/vitest-matchers.ts'],
  },
};
