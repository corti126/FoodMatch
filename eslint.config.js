import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'scripts']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Módulos de lógica (contextos, hooks, servicios, utilidades): no exportan
    // componentes, por lo que la regla de fast-refresh no aplica.
    files: [
      'src/context/**/*.{js,jsx}',
      'src/hooks/**/*.{js,jsx}',
      'src/services/**/*.js',
      'src/utils/**/*.js',
      'src/config/**/*.js',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
