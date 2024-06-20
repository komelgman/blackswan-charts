import type { DeepPartial } from '@/misc/strict-type-checks';
import type Sketcher from '@/model/chart/viewport/sketchers/Sketcher';
import type { ChartStyle } from '@/model/ChartStyle';
import type { DrawingType } from '@/model/datasource/Drawing';

export declare type ChartOptions = {
  style: DeepPartial<ChartStyle>,
  sketchers: Map<DrawingType, Sketcher>
};
