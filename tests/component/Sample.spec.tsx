import { test, expect } from '@playwright/experimental-ct-vue';
import HelloWorld from '@/components/HelloWorld.vue';

test.use({ viewport: { width: 500, height: 500 } });

test('should work1', async ({ mount }) => {
  // @ts-ignore
  const component = await mount(<HelloWorld msg="Greetings" />);
  await expect(component).toContainText('Greetings');
});

test('should work2', async ({ mount }) => {
  const component = await mount(HelloWorld, {
    props: {
      msg: 'Greetings',
    },
  });

  await expect(component).toContainText('Greetings');
});
