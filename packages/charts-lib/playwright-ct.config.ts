import { defineConfig, devices } from '@playwright/experimental-ct-vue';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { fileURLToPath, URL } from 'url';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/component',
  snapshotDir: './tests/.component-snapshots',
  timeout: 10 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never', outputFolder: './tests/.component-report' }],
    ['list'],
  ],

  use: {
    trace: 'on-first-retry',
    ctPort: 3100,
    headless: true,
    ctTemplateDir: './tests/component-template',
    ctCacheDir: './tests/component-template/.cache',
    ctViteConfig: {
      plugins: [
        vue(),
        vueJsx({
          babelPlugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-transform-flow-strip-types'],
          ],
        }),
      ],
      resolve: {
        alias: [
          { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
        ],
      },
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
      expect: {
        toHaveScreenshot: {
          threshold: 0.1,
        },
      },
    },
  ],
});
