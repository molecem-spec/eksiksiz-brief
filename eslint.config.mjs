// ESLint flat config (ESLint 9 + eslint-config-next 16).
// Next 16'da "next lint" kaldirildi; eslint dogrudan calistiriliyor.

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'supabase/**'],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // Supabase sorgulari tipsiz donuyor; engelleyici degil, gorunur kalsin.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
