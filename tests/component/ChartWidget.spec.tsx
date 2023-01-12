import { test, expect } from '@playwright/experimental-ct-vue';
import Chart from '@/model/Chart';
import ChartWidget from '@/components/chart/ChartWidget.vue';
import DataSource from '@/model/datasource/DataSource';
import IdHelper from '@/model/tools/IdHelper';

function delay(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

test.use({ viewport: { width: 1024, height: 800 } });

test.describe('test ChartWidget | one pane mode', () => {
  let idHelper: IdHelper;
  let mainDs: DataSource;
  let chart: Chart;
  let component: any;

  // test.beforeEach(async ({ mount }) => {
  //   idHelper = new IdHelper();
  //   mainDs = new DataSource({ id: 'main', idHelper }, []);
  //   chart = new Chart();
  //
  //   component = await mount(ChartWidget, {
  //     props: {
  //       options: {
  //         chart,
  //       },
  //     },
  //   });
  // });
  //
  // test.afterEach(async () => {
  //   await component.unmount();
  // });

  test('test 0', async ({ page, mount }) => {
    idHelper = new IdHelper();
    mainDs = new DataSource({ id: 'main', idHelper }, []);
    chart = new Chart();

    await chart.createPane(mainDs, { size: 100 });
    await chart.createPane(new DataSource({ id: 'second', idHelper }, []), { size: 100 });

    // @ts-ignore
    component = await mount(ChartWidget, { props: { chart } }); // <-- generate maximum call stack exception, so at now it isn't usable

    await delay(3000);
    await expect(component).toHaveScreenshot({ fullPage: true });
  });

  test('test 1', async ({ page, mount }) => {
    idHelper = new IdHelper();
    mainDs = new DataSource({ id: 'main', idHelper }, []);
    chart = new Chart();

    // @ts-ignore
    component = await mount(ChartWidget, { props: { chart } }); // <-- now it mounted, but changing model after but, doesn't affect on the view

    await chart.createPane(mainDs, { size: 100 });
    await chart.createPane(new DataSource({ id: 'second', idHelper }, []), { size: 100 });

    await delay(3000);
    await expect(component).toHaveScreenshot({ fullPage: true });
  });
});
