/* eslint import/no-unresolved: off */
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      'lib/__tests__/helpers.js',
      'lib/__tests__/__fixtures__/**/*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
    },
  },
});
