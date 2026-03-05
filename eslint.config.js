import base from './packages/ui/eslint.base.js';

export default [
  ...base,
  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname + '/packages/ui',
      },
    },
  },
  {
    files: ['packages/core/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname + '/packages/core',
      },
    },
  },
];
