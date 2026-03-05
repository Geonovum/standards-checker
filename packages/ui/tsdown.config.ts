import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/**/*.{ts,tsx}', '!src/**/*.test.ts'],
  unbundle: true,
  format: 'esm',
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
