import { marketScene, type ExampleScene } from '@demo/gallery/scene';
import { marketData } from '@demo/gallery/data';
export default function create(): ExampleScene {
  const { chart } = marketScene(false, marketData('wide'));
  const axis = chart.paneModel('main').priceAxis;
  return {
    chart,
    note: 'These prices span orders of magnitude, so Linear and Logarithmic look very different. '
      + 'Percentage uses the first visible close as its zero; pan to change that reference. Price fitting is automatic.',
    actions: [
      ['Linear', 'regular'],
      ['Logarithmic', 'log10'],
      ['Percentage', 'percentage'],
    ].map(([label, id]) => ({
      label,
      run: () => {
        axis.scale = id;
      },
    })),
  };
}
