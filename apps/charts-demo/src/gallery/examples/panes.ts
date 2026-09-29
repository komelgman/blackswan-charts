import { marketPane, marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart } = marketScene();
  marketPane(chart, 'comparison', 'log10');
  chart.clearHistory();
  return { chart, note: 'Linear above, logarithmic below. Pan either pane; drag the divider to resize them.' };
}
