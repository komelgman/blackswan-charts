import basic from '@demo/gallery/examples/basic';
import basicCode from '@demo/gallery/examples/basic?raw';
import candles from '@demo/gallery/examples/candles';
import candlesCode from '@demo/gallery/examples/candles?raw';
import panes from '@demo/gallery/examples/panes';
import panesCode from '@demo/gallery/examples/panes?raw';
import scales from '@demo/gallery/examples/scales';
import scalesCode from '@demo/gallery/examples/scales?raw';
import percentage from '@demo/gallery/examples/percentage';
import percentageCode from '@demo/gallery/examples/percentage?raw';
import drawings from '@demo/gallery/examples/drawings';
import drawingsCode from '@demo/gallery/examples/drawings?raw';
import shared from '@demo/gallery/examples/shared';
import sharedCode from '@demo/gallery/examples/shared?raw';
import streaming from '@demo/gallery/examples/streaming';
import streamingCode from '@demo/gallery/examples/streaming?raw';
import history from '@demo/gallery/examples/history';
import historyCode from '@demo/gallery/examples/history?raw';
import channel from '@demo/gallery/examples/channel';
import channelCode from '@demo/gallery/examples/channel?raw';
import events from '@demo/gallery/examples/events';
import eventsCode from '@demo/gallery/examples/events?raw';
import type { ExampleScene } from '@demo/gallery/types';
export const repositoryUrl = 'https://github.com/komelgman/blackswan-charts';
export const gallerySourceUrl = `${repositoryUrl}/blob/master/apps/charts-demo/src/gallery`;
export interface Example {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  learning: string;
  create(): ExampleScene;
  code: string;
}
export const examples: Example[] = [
  {
    id: 'basic', title: 'Your first chart', category: 'Market',
    description: 'A data source, a pane and one Vue widget. Start here.',
    tags: ['Getting started', 'Vue'],
    learning: 'Example creates the chart directly, including the required candle colors. Vue shows how to mount the widget; Data'
      + ' supplies the sample prices.',
    create: basic, code: basicCode,
  },
  {
    id: 'candles', title: 'Price & volume', category: 'Market',
    description: 'Add a volume layer to the same prices, using the built-in chart theme.',
    tags: ['OHLCv', 'Volume'],
    learning: 'Two OHLCv entries share the same content: candles and volume. The price axis follows the candles; volume has its'
      + ' own height inside the pane.',
    create: candles, code: candlesCode,
  },
  {
    id: 'streaming', title: 'One bar at a time', category: 'Market',
    description: 'Append live data, preserve your zoom, and follow the latest bar.',
    tags: ['Live data', 'Auto fit'],
    learning: 'Update the source without user-edit history. AUTO and justFollow handle the axes; mount starts the timer and'
      + ' unmount stops it.',
    create: streaming, code: streamingCode,
  },
  {
    id: 'scales', title: 'A different perspective', category: 'Market',
    description: 'Two trends with the same endpoints, built in different price spaces. Change the axis and watch them curve.',
    tags: ['Scales', 'Percentage'],
    learning: 'A drawing has its own scale, independent of the price axis. The two trends share endpoints but interpolate'
      + ' prices differently. Switching the axis reprojects their geometry without changing either drawing.',
    create: scales, code: scalesCode,
  },
  {
    id: 'percentage', title: 'One reference. Three markets.', category: 'Market',
    description: 'Three price sources share one percentage base: the first visible price of the primary market.',
    tags: ['Percentage', 'Primary source'],
    learning: 'Point every price axis at the primary series. Its first visible close sets the same 0% in all panes; the other'
      + ' series keep their own prices. Panning changes the common reference without rewriting the data.',
    create: percentage, code: percentageCode,
  },
  {
    id: 'panes', title: 'One timeline. Two views.', category: 'Composition',
    description: 'Two different markets, independent price axes, and one shared timeline.',
    tags: ['Panes', 'Layout'],
    learning: 'Add another source and pane to the same chart. Time is shared automatically, while each price axis fits its own'
      + ' primary entry.',
    create: panes, code: panesCode,
  },
  {
    id: 'drawings', title: 'Draw on the data', category: 'Interaction',
    description: 'Solid, dashed and dotted drawings, with handles and scale-aware geometry.',
    tags: ['Handles', 'Editing'],
    learning: 'Add horizontal, vertical and inclined lines in one transaction. Their coordinates stay in the data domain; the'
      + ' library handles dragging, copying and undo.',
    create: drawings, code: drawingsCode,
  },
  {
    id: 'channel', title: 'Room for a trend', category: 'Interaction',
    description: 'A built-in parallel channel with editable slope and width.',
    tags: ['Channel', 'Geometry'],
    learning: 'Channel uses the built-in drawing type. Endpoints set its baseline; offset sets its width. No custom renderer or'
      + ' behavior registration is needed.',
    create: channel, code: channelCode,
  },
  {
    id: 'shared', title: 'Connected by design', category: 'Composition',
    description: 'Shared and local levels, time markers and diagonals across two different markets.',
    tags: ['Sources', 'Sharing'],
    learning: 'shareWith projects an owned drawing into other panes. Local drawings stay independent, even when they have the same'
      + ' local ID in different sources.',
    create: shared, code: sharedCode,
  },
  {
    id: 'events', title: 'Every object has a story', category: 'Interaction',
    description: 'Click a drawing to see its identity, type and event in a floating tooltip.',
    tags: ['Events', 'Tooltip'],
    learning: 'Wrap the public viewport handlers and keep their default behavior. The highlighted entry identifies the object;'
      + ' Vue displays a tooltip. Empty clicks, dragging and zoom dismiss it.',
    create: events, code: eventsCode,
  },
  {
    id: 'history', title: 'Every move, reversible', category: 'Interaction',
    description: 'Group edits, undo and redo, then save and restore the chart as JSON.',
    tags: ['Transactions', 'JSON'],
    learning: 'A transaction groups edits into one undo step. Serialize and restore the chart through the public API; restoring is'
      + ' also undoable.',
    create: history, code: historyCode,
  },
];
