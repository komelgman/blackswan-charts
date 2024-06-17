import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import type AsyncMountOptions from '../../src/components/workaround/AsyncMountOptions';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('dynamic component loading', () => {
  /**
   * main.ts content for that test sample
   *
   * import { createApp } from 'vue';
   * // eslint-disable-next-line
   * (window as any).__testing_tools = {
   *   createApp,
   *   modules: import.meta.glob('./components/**\/*.vue'), // <-- escaped path !!! warn - not working
   * };
   */
  test('ComponentWithAsyncChildren.vue', async ({ page }) => {
    const options: AsyncMountOptions = {
      component: 'HelloWorld.vue',
      props: {
        msg: 'new message',
      },
    };

    await page.evaluate((o) => {
      // eslint-disable-next-line
      const { createApp, modules } = (window as any).__testing_tools;
      modules['./components/workaround/ComponentWithAsyncChildren.vue']().then((module: any) => {
        createApp(module.default, { options: o }).mount('#app');
      });
    }, options);

    const app: Locator = await page.locator('#app');
    await expect(app).toHaveText('new message');
  });
});
