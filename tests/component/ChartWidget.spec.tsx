import { test, expect } from '@playwright/experimental-ct-vue';
import Chart from '@/model/Chart';
import ChartWidget from '@/components/chart/ChartWidget.vue';
import DataSource from '@/model/datasource/DataSource';
import IdHelper from '@/model/tools/IdHelper';

test.use({ viewport: { width: 1024, height: 800 } });

test.describe('test ChartWidget | one pane mode', () => {
  let idHelper: IdHelper;
  let mainDs: DataSource;
  let chart: Chart;
  let component: any;

  test.beforeEach(async ({ mount }) => {
    idHelper = new IdHelper();
    mainDs = new DataSource({ id: 'main', idHelper }, []);
    chart = new Chart();

    component = await mount(ChartWidget, {
      props: {
        options: {
          chart,
        },
      },
    });
  });

  test.afterEach(async () => {
    await component.unmount();
  });

  test('test', async () => {
    console.log(mainDs);
    console.log(component.vm);
    await expect(component).toContainText('Greetings');
  });
});
