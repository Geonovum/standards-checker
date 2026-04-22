import { defineConfig } from 'tsdown';

// Unbundled output: each source file becomes its own dist file with bare-name
// imports preserved. Consumer's bundler resolves them through its own tree
// (peer deps auto-installed in pnpm). No classification list is maintained —
// whatever is in package.json `dependencies`/`peerDependencies` is external.
export default defineConfig({
  entry: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/ui/vitest-setup.ts'],
  unbundle: true,
  format: 'esm',
  dts: true,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  clean: true,
});
