import { toRaw } from 'vue';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import AbstractSketcher from '@/model/sketchers/AbstractSketcher';
import type { OHLCv, VolumeIndicator } from '@/model/type-defs';
import type Viewport from '@/model/viewport/Viewport';

export default class VolumeIndicatorAsColumnsSketcher extends AbstractSketcher<VolumeIndicator> {
  public static readonly NAME: string = 'Columns';

  public draw(entry: DataSourceEntry<VolumeIndicator>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    // todo
    const dataProvider = viewport.dataSource.getDataProvider(entry.descriptor.options.data.dataProvider);
    const data = toRaw(dataProvider?.data) as OHLCv;

    // console.log(data);
  }
}
