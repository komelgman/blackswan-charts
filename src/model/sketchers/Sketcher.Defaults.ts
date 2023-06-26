import type { DrawingType } from '@/model/datasource/Drawing';
import type Sketcher from '@/model/sketchers/Sketcher';
import LineSketcher from '@/model/sketchers/LineSketcher';
import HLineSketcher from '@/model/sketchers/HLineSketcher';
import VLineSketcher from '@/model/sketchers/VLineSketcher';

export default new Map<DrawingType, Sketcher>([
  ['Line', new LineSketcher()],
  ['HLine', new HLineSketcher()],
  ['VLine', new VLineSketcher()],
]);
