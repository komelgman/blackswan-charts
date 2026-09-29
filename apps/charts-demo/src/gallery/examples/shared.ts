import { type Price } from 'blackswan-charts';
import { lineStyle, marketPane, marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart, source } = marketScene();
  source.beginTransaction();
  marketPane(chart, 'comparison');
  source.add({
    id: 'HLine1',
    type: 'HLine',
    visible: true,
    locked: false,
    shareWith: '*',
    data: { def: 125 as Price, style: lineStyle },
  });
  source.endTransaction();
  chart.clearHistory();
  return { chart, note: 'One level, two sources. Move the amber line in either pane; both projections follow the same edit.' };
}
