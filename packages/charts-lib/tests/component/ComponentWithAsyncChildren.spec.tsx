import { test, expect } from '@playwright/experimental-ct-vue';
import ComponentWithAsyncChildren from '@/components/workaround/ComponentWithAsyncChildren.vue';

test.use({ viewport: { width: 500, height: 500 } });

test('check simple component (HelloWorld) native mount', async ({ page, mount }) => {
  await mount(ComponentWithAsyncChildren, {
    props: { // must be serializable
      options: {
        component: 'HelloWorld',
        props: {
          msg: 'test message',
        },
      },
    },
  });

  await expect(page.locator('#root')).toContainText('test message');
});
