import { defineConfig, globalIgnores } from 'eslint/config'

import astro from 'eslint-plugin-astro'
import prettier from 'eslint-config-prettier/flat'
import js from '@eslint/js'
import globals from 'globals'
import typescript from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', '.astro', '*.d.ts']),

  js.configs.recommended,
  ...typescript.configs.recommended,
  ...astro.configs.recommended,
  prettier,

  {
    files: ['public/**', 'src/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        Alpine: 'readonly',
      },
    },
  },
])
