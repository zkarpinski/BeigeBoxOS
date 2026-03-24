import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  ...nextCoreWebVitals,
  prettierRecommended,
  {
    rules: {
      // TODO: Re-enable these rules and fix the underlying issues. See
      // Keep migration behavior close to previous ESLint setup; these were introduced
      // by newer React compiler-oriented lint rules and require larger refactors.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      'react/no-unescaped-entities': 'off',
    },
    ignores: ['coverage/**'],
  },
];
