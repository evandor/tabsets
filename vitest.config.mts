import path from 'path'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: 'test/vitest/setup-file.ts', // additional info see https://stackoverflow.com/questions/72260793/how-to-mock-stub-vue-i18n
    testTimeout: 50000,
    hookTimeout: 50000,
    include: [
      // Matches vitest tests in any subfolder of 'src' or into 'test/vitest/__tests__'
      // Matches all files with extension 'js', 'jsx', 'ts' and 'tsx'
      'src/**/*.vitest.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'test/vitest/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    coverage: {
      reporter: ['text', 'lcov', 'json-summary', 'json'],
      exclude: [
        ...configDefaults.exclude,
        '**/*.config.{js,ts}',
        'e2e/**',
        '.quasar/**',
        'playwright-report/**',
        'docs/**',
        'tools/**',
      ],
    },
    // https://vitest.dev/guide/browser.html
    browser: {
      enabled: false,
      name: 'chrome', // browser name is required
    },
  },
  resolve: {
    //conditions: process.env.VITEST ? ['node'] : []
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    quasar({
      sassVariables: 'src/quasar-variables.scss',
    }),
    tsconfigPaths(),
  ],
})
