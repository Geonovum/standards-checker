import yaml from '@modyfi/vite-plugin-yaml';
import react from '@vitejs/plugin-react';
import { defineConfig, mergeConfig, type UserConfigExport } from 'vite';

const sharedConfig = defineConfig({
  plugins: [react(), yaml()],
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
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
});

/**
 * Create a Vite configuration for a standards-checker app.
 *
 * Usage in your vite.config.ts:
 *   import { createConfig } from '@geonovum/standards-checker/vite';
 *   export default createConfig({ base: '/my-app/' });
 */
export function createConfig(overrides: Record<string, unknown>): UserConfigExport {
  return defineConfig(mergeConfig(sharedConfig, overrides));
}
