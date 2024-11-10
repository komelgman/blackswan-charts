import { createApp } from 'vue';
import { Chart } from '@/model/chart/Chart';
import DataSource from '@/model/datasource/DataSource';
import type { DataSourceOptions, DrawingOptions } from '@/model/datasource/types';
import { IdHelper } from '@/model/tools/IdHelper';
import type ChartWidgetTestContext from '../component/tools/ChartWidgetTestContext';

const idHelper = new IdHelper();
const chart = new Chart(idHelper);
const newDataSource = (options: DataSourceOptions, drawings: DrawingOptions[]) => new DataSource(options, drawings);
let $nextTick = (callback: () => void) => callback();

function mount(): Promise<void> {
  return new Promise((resolve) => {
    import('@/components/chart/ChartWidget.vue').then((module) => {
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
  mount, idHelper, chart, newDataSource, delay,
};

// eslint-disable-next-line
(window as any).__test_context = context;
