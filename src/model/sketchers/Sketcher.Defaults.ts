import type { DrawingType } from '@/model/datasource/Drawing';
import HLineSketcher from '@/model/sketchers/HLineSketcher';
import type Sketcher from '@/model/sketchers/Sketcher';
import VLineSketcher from '@/model/sketchers/VLineSketcher';

export default new Map<DrawingType, Sketcher>([
  ['HLine', new HLineSketcher()],
  ['VLine', new VLineSketcher()],
]);
