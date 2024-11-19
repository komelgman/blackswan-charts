import type { ChartStyle } from '@/model/chart/types/styles';
import type { SerializedPane, SerializedTimeAxis } from '@/model/chart/serialization/types';
import type { DeepPartial } from '@/model/type-defs';

export declare type SerializedChart = {
  style: DeepPartial<ChartStyle>;
  panes: SerializedPane[];
  timeAxis: SerializedTimeAxis;
};
