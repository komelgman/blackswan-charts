/* eslint-disable function-paren-newline */
import HLineSketcher from '@/model/chart/viewport/sketchers/HLineSketcher';
import LineSketcher from '@/model/chart/viewport/sketchers/LineSketcher';
import OHLCvPlotSketcher from '@/model/chart/viewport/sketchers/OHLCvPlotSketcher';
import type Sketcher from '@/model/chart/viewport/sketchers/Sketcher';
import SketcherGroup, { subtypeFromPlotOptionsStyleType, subtypeFromPlotOptionsType } from '@/model/chart/viewport/sketchers/SketcherGroup';
import VLineSketcher from '@/model/chart/viewport/sketchers/VLineSketcher';
import { CandlestickPlotRenderer, ColumnsVolumeRenderer } from '@/model/chart/viewport/sketchers/renderers';
import type { DrawingType } from '@/model/datasource/types';

export default new Map<DrawingType, Sketcher>([
  [
    'OHLCv', new SketcherGroup(subtypeFromPlotOptionsType)
      .addSubtype('CandlestickPlot', new OHLCvPlotSketcher(new CandlestickPlotRenderer()))
      .addSubtype(
        'VolumeIndicator', new SketcherGroup(subtypeFromPlotOptionsStyleType)
          .addSubtype('Columns', new OHLCvPlotSketcher(new ColumnsVolumeRenderer())),
      ),
  ],
  ['Line', new LineSketcher()],
  ['HLine', new HLineSketcher()],
  ['VLine', new VLineSketcher()],
]);
