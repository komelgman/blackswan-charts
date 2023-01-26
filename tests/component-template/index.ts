import Chart from '@/model/Chart';
import IdHelper from '@/model/tools/IdHelper';
import DataSource from '@/model/datasource/DataSource';
import type { DataSourceOptions } from '@/model/datasource/DataSource';
import type { DrawingOptions } from '@/model/datasource/Drawing';
import type ChartWidgetTestContext from '../component/ChartWidgetTestContext';

const modules = import.meta.glob('@/components/**/*.vue');
const idHelper = new IdHelper();
const chart = new Chart();
const newDataSource = (options: DataSourceOptions, drawings: DrawingOptions[]) => new DataSource(options, drawings);

function mount(): void {
  modules['/src/components/chart/ChartWidget.vue']().then((module: any) => {
    // @ts-ignore
    createApp(module.default, { chart }).mount('#root');
  });
}

const context: ChartWidgetTestContext = {
  mount, idHelper, chart, newDataSource,
};

// eslint-disable-next-line
(window as any).__test_context = context;
