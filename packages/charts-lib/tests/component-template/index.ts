import { createApp } from 'vue';
import { Chart, type ChartOptions } from '@/model/chart/Chart';
import DataSource from '@/model/datasource/DataSource';
import type { DataSourceOptions, DrawingOptions, DrawingType } from '@/model/datasource/types';
import { IdHelper } from '@blackswan/foundation';
import type ChartWidgetTestContext from '../component/tools/ChartWidgetTestContext';
import { Themes } from '@/model/chart/types/styles';
import type { Sketcher } from '@/model/chart/viewport/sketchers';

const chartOptions: Partial<ChartOptions> = {
  sketchers: new Map<DrawingType, Sketcher>([]),
  theme: Themes.DARK,
};
const idHelper = new IdHelper();
const chart = new Chart(idHelper, chartOptions);
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

 
(window as any).__test_context = context;
