import HLineSketcher from '@/model/chart/viewport/sketchers/HLineSketcher';
import LineSketcher from '@/model/chart/viewport/sketchers/LineSketcher';
import OHLCvChartSketcher from '@/model/chart/viewport/sketchers/OHLCvChartSketcher';
import type Sketcher from '@/model/chart/viewport/sketchers/Sketcher';
import VLineSketcher from '@/model/chart/viewport/sketchers/VLineSketcher';
import VolumeIndicatorAsColumnsSketcher from '@/model/chart/viewport/sketchers/VolumeIndicatorAsColumnsSketcher';
import type { DrawingType } from '@/model/datasource/types';

export default new Map<DrawingType, Sketcher>([
  ['OHLCv', new OHLCvChartSketcher()],
  ['Volume', new VolumeIndicatorAsColumnsSketcher()],
  ['Line', new LineSketcher()],
  ['HLine', new HLineSketcher()],
  ['VLine', new VLineSketcher()],
]);
