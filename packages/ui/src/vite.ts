import yaml from '@modyfi/vite-plugin-yaml';
import react from '@vitejs/plugin-react';
import { createRequire } from 'module';
import { defineConfig, mergeConfig, type ViteUserConfigExport } from 'vitest/config';

const _require = createRequire(import.meta.url);

/**
 * Vite plugin that resolves dependencies from this package's node_modules.
 * The pre-built dist files import packages like zustand, clsx, etc. that are
 * dependencies of the UI package. With pnpm's strict node_modules, the consumer
 * app can't resolve these directly. This plugin resolves them from the UI
 * package's own node_modules, letting Vite's default resolver try first so that
 * shared packages (react, react-dom, etc.) resolve to a single copy.
 *
 * This also handles the linked development case where the UI package is
 * symlinked from outside the consumer's node_modules.
 */
function resolveDeps() {
  return {
    name: 'resolve-deps',
    async resolveId(
      this: { resolve: (source: string, importer?: string, options?: Record<string, unknown>) => Promise<unknown> },
      source: string,
      importer: string | undefined,
      options: Record<string, unknown>,
    ) {
      if (!source || source.startsWith('.') || source.startsWith('/') || source.startsWith('\0')) return null;
      if (!importer) return null;
      // Let Vite's default resolver try first — this ensures packages the consumer
      // has installed (react, react-router-dom, etc.) resolve to a single copy.
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (resolved) return resolved;
      // Fallback: resolve from the UI package's own node_modules
      try {
        return _require.resolve(source);
      } catch {
        return null;
      }
    },
  };
}

const sharedConfig = defineConfig({
  plugins: [react(), yaml(), resolveDeps()],
  build: {
    // Use esbuild for minification instead of Vite 8's default OXC minifier.
    // OXC converts string literals to template literals (backticks), which breaks
    // nimma's Fallback codegen that embeds Function.toString() output inside a
    // TemplateLiteral AST node — the inner backticks break the outer template.
    minify: 'esbuild',
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
      onLog(level, log, defaultHandler) {
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
});

/**
 * Create a Vite configuration for a standards-checker app.
 *
 * Usage in your vite.config.ts:
 *   import { createConfig } from '@geonovum/standards-checker-ui/vite';
 *   export default createConfig({ base: '/my-app/' });
 */
export function createConfig(overrides: Record<string, unknown>): ViteUserConfigExport {
  return defineConfig(mergeConfig(sharedConfig, overrides));
}
