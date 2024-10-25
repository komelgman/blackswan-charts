/* eslint-disable function-paren-newline */
import {
  HLineSketcher,
  LineSketcher,
  OHLCvPlotSketcher,
  OHLCvVolumeSketcher,
  SketcherGroup,
  subtypeFromPlotOptionsStyleType,
  subtypeFromPlotOptionsType,
  VLineSketcher,
  type Sketcher,
} from '@/model/chart/viewport/sketchers';
import {
  CandlestickPlotRenderer,
  ColumnsVolumeRenderer,
} from '@/model/chart/viewport/sketchers/renderers';
import type { DrawingType } from '@/model/datasource/types';

export default new Map<DrawingType, Sketcher>([
  [
    'OHLCv', new SketcherGroup(subtypeFromPlotOptionsType)
      .addSubtype('CandlestickPlot', new OHLCvPlotSketcher(new CandlestickPlotRenderer()))
      .addSubtype(
        'VolumeIndicator', new SketcherGroup(subtypeFromPlotOptionsStyleType)
          .addSubtype('Columns', new OHLCvVolumeSketcher(new ColumnsVolumeRenderer())),
      ),
  ],
  ['Line', new LineSketcher()],
  ['HLine', new HLineSketcher()],
  ['VLine', new VLineSketcher()],
]);
