import type { SerializedPane, SerializedTimeAxis } from '@/model/chart/serialization/types';
import type { ChartTheme } from '@/model/chart/types/styles';

export declare type SerializedChart = {
  theme: ChartTheme;
  panes: SerializedPane[];
  timeAxis: SerializedTimeAxis;
};
