import type { DrawingType } from '@/model/datasource/Drawing';
import OHLCvChartSketcher from '@/model/sketchers/OHLCvChartSketcher';
import VolumeIndicatorAsColumnsSketcher from '@/model/sketchers/VolumeIndicatorAsColumnsSketcher';
import HLineSketcher from '@/model/sketchers/HLineSketcher';
import LineSketcher from '@/model/sketchers/LineSketcher';
import type Sketcher from '@/model/sketchers/Sketcher';
import VLineSketcher from '@/model/sketchers/VLineSketcher';

export default new Map<DrawingType, Sketcher>([
  ["OHLCv", new OHLCvChartSketcher()],
  ['Volume', new VolumeIndicatorAsColumnsSketcher()],
  ['Line', new LineSketcher()],
  ['HLine', new HLineSketcher()],
  ['VLine', new VLineSketcher()],
]);
