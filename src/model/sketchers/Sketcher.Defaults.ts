import type { DrawingType } from '@/model/datasource/Drawing';
import CandlestickChartSketcher from '@/model/sketchers/CandlestickChartSketcher';
import ColumnsVolumeSketcher from '@/model/sketchers/ColumnsVolumeSketcher';
import HLineSketcher from '@/model/sketchers/HLineSketcher';
import LineSketcher from '@/model/sketchers/LineSketcher';
import type Sketcher from '@/model/sketchers/Sketcher';
import VLineSketcher from '@/model/sketchers/VLineSketcher';
import SubtypedSketcher from '@/model/sketchers/SubtypedSketcher';

export default new Map<DrawingType, Sketcher<any>>([
  ['OHLCv', new SubtypedSketcher({
    [CandlestickChartSketcher.NAME]: new CandlestickChartSketcher(),
  })],
  ['Volume', new SubtypedSketcher({
    [ColumnsVolumeSketcher.NAME]: new ColumnsVolumeSketcher(),
  })],
  ['Line', new LineSketcher()],
  ['HLine', new HLineSketcher()],
  ['VLine', new VLineSketcher()],
]);
