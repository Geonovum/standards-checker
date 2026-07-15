#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Resolve tsdown from this package's own dependencies, wherever the bin shim
// lives in the consumer's tree.
const require = createRequire(realpathSync(fileURLToPath(import.meta.url)));
const { build } = await import(pathToFileURL(require.resolve('tsdown')).href);

const RAW_QUERY = /\?raw$/;

// Rolldown doesn't implement Vite's `?raw` suffix imports (raw file content as
// a string), which consumer apps use for example fixtures; resolve and inline
// them here so CLI bundles behave like the Vite-built webapp.
const rawImports = {
  name: 'raw-imports',
  resolveId(source, importer) {
    if (!RAW_QUERY.test(source) || !importer) return null;
    return `${resolve(dirname(importer), source.replace(RAW_QUERY, ''))}?raw`;
  },
  load(id) {
    if (!RAW_QUERY.test(id)) return null;
    return { code: `export default ${JSON.stringify(readFileSync(id.replace(RAW_QUERY, ''), 'utf8'))};`, moduleType: 'js' };
  },
};

const entry = process.argv.slice(2);
if (entry.length === 0 || entry.some(arg => arg.startsWith('-'))) {
  console.error('Usage: build-cli <entry> [...entry]');
  process.exit(1);
}

// The tsdown JS API instead of its CLI: everything stays relative to the
// consumer's cwd, and the raw-imports plugin can be passed directly (the CLI
// only takes plugins via a config file, which would shift relative paths to
// the config's directory). `config: false` keeps the build fully standard —
// a consumer tsdown.config.ts is not loaded.
try {
  await build({
    entry,
    config: false,
    format: 'esm',
    platform: 'node',
    sourcemap: true,
    outDir: 'dist',
    clean: true,
    plugins: [rawImports],
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
