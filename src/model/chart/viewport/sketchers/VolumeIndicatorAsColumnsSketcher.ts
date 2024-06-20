import AbstractSketcher from '@/model/chart/viewport/sketchers/AbstractSketcher';
import type Viewport from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { VolumeIndicator } from '@/model/type-defs';

export default class VolumeIndicatorAsColumnsSketcher extends AbstractSketcher<VolumeIndicator<any>> {

  protected draw(entry: DataSourceEntry<VolumeIndicator<any>>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    // todo
    // const dataProvider = viewport.dataSource.getDataProvider(entry.descriptor.options.data.dataProvider);
    // const data = toRaw(dataProvider?.data) as OHLCv;

    // console.log(data);
  }
}
