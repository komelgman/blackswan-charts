import { marketPane, marketScene, type ExampleScene } from '@demo/gallery/scene';
import { marketData } from '@demo/gallery/data';
export default function create(): ExampleScene {
  const { chart } = marketScene();
  marketPane(chart, 'comparison', marketData('falling'));
  chart.clearHistory();
  return {
    chart,
    note: 'Two different markets: rising above, falling below. Pan either pane along the shared timeline; drag the divider to resize.',
  };
}
