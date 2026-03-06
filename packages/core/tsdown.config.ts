import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.test.ts'],
  unbundle: true,
  format: 'esm',
  dts: true,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  clean: true,
});
