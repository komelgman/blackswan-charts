import candles from '@demo/gallery/examples/candles';
import candlesCode from '@demo/gallery/examples/candles?raw';
import panes from '@demo/gallery/examples/panes';
import panesCode from '@demo/gallery/examples/panes?raw';
import scales from '@demo/gallery/examples/scales';
import scalesCode from '@demo/gallery/examples/scales?raw';
import drawings from '@demo/gallery/examples/drawings';
import drawingsCode from '@demo/gallery/examples/drawings?raw';
import shared from '@demo/gallery/examples/shared';
import sharedCode from '@demo/gallery/examples/shared?raw';
import history from '@demo/gallery/examples/history';
import historyCode from '@demo/gallery/examples/history?raw';
import channel from '@demo/gallery/examples/channel';
import channelCode from '@demo/gallery/examples/channel?raw';
import type { ExampleScene } from '@demo/gallery/scene';
export interface Example {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  create(): ExampleScene;
  code: string;
}
export const examples: Example[] = [
  {
    id: 'candles',
    title: 'Price & volume',
    category: 'Market',
    description: 'A familiar market view, built from two complementary layers.',
    tags: ['OHLCv', 'Volume'],
    create: candles,
    code: candlesCode,
  },
  {
    id: 'panes',
    title: 'One timeline. Two views.',
    category: 'Composition',
    description: 'Independent price axes, a shared timeline, and a movable divider.',
    tags: ['Panes', 'Layout'],
    create: panes,
    code: panesCode,
  },
  {
    id: 'scales',
    title: 'A different perspective',
    category: 'Market',
    description: 'Explore the same prices through linear, log and percentage scales.',
    tags: ['Scales', 'Zoom'],
    create: scales,
    code: scalesCode,
  },
  {
    id: 'drawings',
    title: 'Draw on the data',
    category: 'Interaction',
    description: 'Lines, levels and time markers that stay connected to their coordinates.',
    tags: ['Handles', 'Editing'],
    create: drawings,
    code: drawingsCode,
  },
  {
    id: 'shared',
    title: 'Connected by design',
    category: 'Composition',
    description: 'Edit one drawing across multiple panes without copying its state.',
    tags: ['Sources', 'Sharing'],
    create: shared,
    code: sharedCode,
  },
  {
    id: 'history',
    title: 'Every move, reversible',
    category: 'Interaction',
    description: 'Step back, step forward, and restore a saved chart.',
    tags: ['Undo / redo', 'JSON'],
    create: history,
    code: historyCode,
  },
  {
    id: 'channel',
    title: 'Room for a trend',
    category: 'Interaction',
    description: 'A parallel channel with independently editable slope and width.',
    tags: ['Channel', 'Extension'],
    create: channel,
    code: channelCode,
  },
];
