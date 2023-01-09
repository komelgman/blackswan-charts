import { test, expect } from '@playwright/experimental-ct-vue';
import type { ChartStyle } from '@/model/ChartStyle';
import type { DrawingType } from '@/model/datasource/Drawing';
import type Sketcher from '@/model/sketchers/Sketcher';
import type { DeepPartial } from '@/misc/strict-type-checks';
import ChartWidget from '@/components/chart/ChartWidget.vue';
import DataSource from '@/model/datasource/DataSource';
import IdHelper from '@/model/tools/IdHelper';

test.use({ viewport: { width: 1024, height: 800 } });

test.describe('test ChartWidget | one pane mode', () => {
  let chartStyle: DeepPartial<ChartStyle>;
  let customSketchers: Map<DrawingType, Sketcher>;
  let idHelper: IdHelper;
  let mainDs: DataSource;
  let component: any;

  test.beforeEach(async ({ mount }) => {
    chartStyle = {};
    customSketchers = new Map<DrawingType, Sketcher>([]);
    idHelper = new IdHelper();
    mainDs = new DataSource({ id: 'main', idHelper }, []);

    component = await mount(ChartWidget, {
      props: {
        options: {
          style: chartStyle,
          sketchers: customSketchers,
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
