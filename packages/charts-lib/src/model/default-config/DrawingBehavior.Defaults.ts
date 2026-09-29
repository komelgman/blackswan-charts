import { moveChannel } from '@/model/chart/drawing/channel';
import type { DrawingBehavior } from '@/model/chart/drawing/DrawingBehavior';
import { moveLine, moveHLine, moveVLine } from '@/model/chart/drawing/line-behaviors';
export default new Map<string, DrawingBehavior>([
  ['Line', moveLine],
  ['HLine', moveHLine],
  ['VLine', moveVLine],
  ['Channel', moveChannel],
]);
