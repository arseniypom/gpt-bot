import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    extends: [
      'plugin:prettier/recommended',
    ],
    plugins: [
      'prettier',
    ],
    rules: {
      'no-console': 'warn',
      semi: ['error', 'always'],
      eqeqeq: 'error',
      indent: ['error', 2],
      '@typescript-eslint/no-floating-promises': 'error',
      'prettier/prettier': 'error',
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    ignores: ['eslint.config.mjs'],
  },
);
