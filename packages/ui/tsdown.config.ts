import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/vitest-setup.ts'],
  unbundle: true,
  format: 'esm',
  dts: true,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  clean: true,
  deps: {
    neverBundle: ['react', 'react-dom', 'react/jsx-runtime'],
  },
});
