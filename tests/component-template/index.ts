import { toRaw } from 'vue';
import Chart from '@/model/Chart';
import IdHelper from '@/model/tools/IdHelper';
import DataSource from '@/model/datasource/DataSource';
import type { DataSourceOptions } from '@/model/datasource/DataSource';
import type { DrawingOptions } from '@/model/datasource/Drawing';
import type ChartWidgetTestContext from '../component/tools/ChartWidgetTestContext';

const modules = import.meta.glob('@/components/**/*.vue');
const idHelper = new IdHelper();
const chart = new Chart();
const newDataSource = (options: DataSourceOptions, drawings: DrawingOptions[]) => new DataSource(options, drawings);
let $nextTick = (callback: () => void) => callback();

function mount(): Promise<void> {
  return new Promise((resolve) => {
    modules['/src/components/chart/ChartWidget.vue']().then((module: any) => {
      // @ts-ignore
      $nextTick = createApp(module.default, { chart }).mount('#root').$nextTick;
      $nextTick(resolve);
    });
  });
}

function delay(): Promise<void> {
  return new Promise<void>((resolve) => {
    $nextTick(resolve);
  });
}

const context: ChartWidgetTestContext = {
  mount, idHelper, chart, newDataSource, delay, toRaw,
};

// eslint-disable-next-line
(window as any).__test_context = context;
