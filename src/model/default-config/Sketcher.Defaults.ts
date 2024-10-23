import HLineSketcher from '@/model/chart/viewport/sketchers/HLineSketcher';
import LineSketcher from '@/model/chart/viewport/sketchers/LineSketcher';
import OHLCvChartSketcher from '@/model/chart/viewport/sketchers/OHLCvChartSketcher';
import type Sketcher from '@/model/chart/viewport/sketchers/Sketcher';
import VLineSketcher from '@/model/chart/viewport/sketchers/VLineSketcher';
import type { DrawingType } from '@/model/datasource/types';
import SketcherGroup, { styleTypeAsSubtypeMatcher } from '@/model/chart/viewport/sketchers/SketcherGroup';
import { CandlestickChartRenderer } from '@/model/chart/viewport/sketchers/renderers';

export default new Map<DrawingType, Sketcher>([
  [
    'OHLCv', new SketcherGroup(styleTypeAsSubtypeMatcher)
      .addSubtype('CandlestickChart', new OHLCvChartSketcher(new CandlestickChartRenderer())),
  ],
  ['Line', new LineSketcher()],
  ['HLine', new HLineSketcher()],
  ['VLine', new VLineSketcher()],
]);
