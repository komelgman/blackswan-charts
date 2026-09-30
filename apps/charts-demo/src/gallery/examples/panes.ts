import { ControlMode } from 'blackswan-charts';
import { marketPane, marketScene, type ExampleScene } from '@demo/gallery/scene';
import { marketData, time } from '@demo/gallery/data';
export default function create(): ExampleScene {
  const { chart } = marketScene();
  marketPane(chart, 'comparison', 'regular', false, marketData('falling'));
  chart.clearHistory();
  return {
    chart,
    start() {
      chart.timeAxis.noHistoryManagedUpdate({ controlMode: ControlMode.MANUAL, range: { from: time(-4), to: time(125) } });
    },
    note: 'Two different markets: rising above, falling below. Pan either pane along the shared timeline; drag the divider to resize.',
  };
}
