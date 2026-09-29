import { marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart } = marketScene();
  const axis = chart.paneModel('main').priceAxis;
  return {
    chart,
    note: 'Percentage uses the first visible close as its zero. Pan horizontally to change the reference.',
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
