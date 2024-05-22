import { configDefaults, defineConfig } from 'vitest/config';

const exclude = [
  ...configDefaults.exclude,
  'lib/__tests__/helpers.js',
  'lib/__tests__/__fixtures__/**/*',
];

export default defineConfig({
  test: {
    exclude,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: exclude.concat('index.js'),
    },
  },
});
