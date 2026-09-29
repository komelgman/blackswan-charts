import { type Price } from 'blackswan-charts';
import { time } from '@demo/gallery/data';
import { addTrend, lineStyle, marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart, source } = marketScene();
  source.beginTransaction();
  addTrend(source);
  source.add({
    id: 'HLine1',
    type: 'HLine',
    visible: true,
    locked: false,
    data: { def: 130 as Price, style: { ...lineStyle, color: '#8faee0', fill: 2 } },
  });
  source.add({
    id: 'VLine1',
    type: 'VLine',
    visible: true,
    locked: false,
    data: { def: time(70), style: { ...lineStyle, color: '#d68078', fill: 1 } },
  });
  source.endTransaction();
  chart.clearHistory();
  return { chart, note: 'Drag a line or its handles. Ctrl-drag creates a copy. Undo and redo restore the complete edit.' };
}
