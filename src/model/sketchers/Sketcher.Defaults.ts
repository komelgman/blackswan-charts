import { DrawingType } from '@/model/datasource/Drawing';
import Sketcher from '@/model/sketchers/Sketcher';
import HLineSketcher from '@/model/sketchers/HLineSketcher';
import VLineSketcher from '@/model/sketchers/VLineSketcher';

export default new Map<DrawingType, Sketcher>([
  ['HLine', new HLineSketcher()],
  ['VLine', new VLineSketcher()],
]);
