// Base ESLint config — extended by each OS package
module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/refs': 'off',
    'react-hooks/static-components': 'off',
    'react-hooks/preserve-manual-memoization': 'off',
    'react-hooks/immutability': 'off',
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'off',
  },
};
