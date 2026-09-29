import { marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart } = marketScene(true);
  return { chart, note: 'Scroll to zoom; drag empty space to pan. Prices and volume use the same fixed series.' };
}
