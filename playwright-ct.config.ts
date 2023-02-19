import type { PlaywrightTestConfig } from '@playwright/experimental-ct-vue';
import { devices } from '@playwright/experimental-ct-vue';
import viteConfig from './vite.config';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
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
    ctViteConfig: viteConfig as any,
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
};

export default config;
