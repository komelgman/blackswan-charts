import { shallowRef } from 'vue';
import {
  LineBound,
  LineFillStyle,
  PriceScales,
  type MouseClickEvent,
  type Price,
  type Viewport,
} from 'blackswan-charts';
import { time } from '@demo/gallery/data';
import { marketScene } from '@demo/gallery/scene';
import type { ExampleScene, ObjectEventDetails } from '@demo/gallery/types';
export type { ObjectEventDetails } from '@demo/gallery/types';

export default function create(): ExampleScene {
  const { chart, source } = marketScene();
  const style = { color: '#e2b77c', lineWidth: 2 as const, fill: LineFillStyle.Solid };
  source.beginTransaction();
  source.add({
    id: 'HLine1', type: 'HLine', visible: true, locked: false,
    data: { def: 125 as Price, style },
  });
  source.add({
    id: 'VLine1', type: 'VLine', visible: true, locked: false,
    data: { def: time(68), style },
  });
  source.add({
    id: 'Line1', type: 'Line', visible: true, locked: false,
    data: {
      def: [time(20), 102 as Price, time(95), 142 as Price],
      scale: PriceScales.regular,
      boundType: LineBound.Both,
      style,
    },
  });
  source.endTransaction();
  chart.clearHistory();

  const objectEvent = shallowRef<ObjectEventDetails>();
  const handlers = chart.userInteractions.viewportInteractionsHandler;
  const { onLeftMouseBtnClick } = handlers;

  function showObjectEvent(viewport: Viewport, e: MouseClickEvent, event: ObjectEventDetails['event']) {
    // Refresh the hit before reading it: a click need not be preceded by mouse movement.
    viewport.updateHighlightes(e);
    const entry = viewport.highlighted;
    if (!entry) {
      objectEvent.value = undefined;
      return;
    }
    const { ref, options } = entry.descriptor;
    const [sourceId, drawingId] = Array.isArray(ref) ? ref : [viewport.dataSource.id, ref];
    objectEvent.value = {
      sourceId,
      drawingId,
      drawingType: options.type,
      event,
      handle: viewport.highlightedHandleId,
      x: e.x,
      y: e.y,
    };
  }

  function dismiss<Args extends unknown[]>(handler: (...args: Args) => void) {
    return (...args: Args) => {
      objectEvent.value = undefined;
      handler(...args);
    };
  }

  Object.assign(handlers, {
    onLeftMouseBtnClick(viewport: Viewport, e: MouseClickEvent) {
      showObjectEvent(viewport, e, 'click');
      onLeftMouseBtnClick(viewport, e); // Keep the library's selection and Ctrl-click behavior.
    },
    onLeftMouseBtnDoubleClick(viewport: Viewport, e: MouseClickEvent) {
      showObjectEvent(viewport, e, 'dblclick');
    },
    onDragStart: dismiss(handlers.onDragStart),
    onZoom: dismiss(handlers.onZoom),
  });
  // Navigation can also start on either axis; keep their normal handlers intact.
  const { timeAxisInteractionsHandler, priceAxisInteractionsHandler } = chart.userInteractions;
  timeAxisInteractionsHandler.onDragStart = dismiss(timeAxisInteractionsHandler.onDragStart);
  timeAxisInteractionsHandler.onZoom = dismiss(timeAxisInteractionsHandler.onZoom);
  priceAxisInteractionsHandler.onDragStart = dismiss(priceAxisInteractionsHandler.onDragStart);
  priceAxisInteractionsHandler.onZoom = dismiss(priceAxisInteractionsHandler.onZoom);

  return {
    chart,
    get objectEvent() { return objectEvent.value; },
    note: 'Click a line to read its source, identifier and event. Double-click changes the event to dblclick. '
      + 'A selected line also has named handles. Click empty space, drag or zoom to dismiss the details.',
  };
}
