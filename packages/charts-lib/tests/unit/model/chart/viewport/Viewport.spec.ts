import { describe, expect, it, vi } from 'vitest';
import { Viewport } from '@/model/chart/viewport/Viewport';
import DataSource from '@/model/datasource/DataSource';
import { HistoricalTransactionManager, History } from '@/model/history';
import { IdHelper } from '@blackswan/foundation';
import type { DragMoveEvent, GenericMouseEvent, MouseClickEvent } from '@blackswan/layered-canvas/model';
import type { LayerContext } from '@blackswan/layered-canvas/model';
import type { DataSourceEntry, DrawingOptions } from '@/model/datasource/types';
import type { Sketcher } from '@/model/chart/viewport/sketchers';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';

type DragHandleSpy = ReturnType<typeof vi.fn>;

function createDataSource() {
  const history = new History();
  const idHelper = new IdHelper();
  const manager = new HistoricalTransactionManager(idHelper, history);
  const ds = new DataSource({ id: 'main', idHelper });
  ds.transactionManager = manager;

  return { ds, manager };
}

function addEntry(ds: DataSource, drawing: DrawingOptions): DataSourceEntry {
  ds.beginTransaction();
  ds.add(drawing);
  ds.endTransaction();

  return ds.get(drawing.id);
}

function createViewport(ds: DataSource, sketcher: Sketcher, overrides?: Partial<{
  timeAxis: TimeAxis;
  priceAxis: PriceAxis;
}>) {
  const timeAxis = overrides?.timeAxis ?? ({
    move: vi.fn(),
    screenSize: { main: 500, second: 0 },
    zoom: vi.fn(),
  } as unknown as TimeAxis);

  const priceAxis = overrides?.priceAxis ?? ({
    move: vi.fn(),
    isManualControlMode: vi.fn(() => true),
  } as unknown as PriceAxis);

  const sketchers = new Map([[ 'line', sketcher ]]);

  return { viewport: new Viewport(ds, timeAxis, priceAxis, sketchers), timeAxis, priceAxis };
}

describe('Viewport selection and dragging', () => {
  it('updateSelection clears without ctrl and toggles with ctrl', () => {
    const { ds } = createDataSource();
    const sketcher: Sketcher = {
      invalidate: () => true,
      setChartStyle: () => {},
      contextmenu: () => [],
      dragHandle: () => undefined,
    };
    const { viewport } = createViewport(ds, sketcher);

    const entry1 = addEntry(ds, { id: 'line1', data: {}, type: 'line', locked: false, visible: true });
    const entry2 = addEntry(ds, { id: 'line2', data: {}, type: 'line', locked: false, visible: true });

    viewport.selected.add(entry1);
    viewport.highlighted = entry2;

    viewport.updateSelection(false);

    expect(viewport.selected.has(entry1)).toBe(false);
    expect(viewport.selected.has(entry2)).toBe(true);

    viewport.updateSelection(true);
    expect(viewport.selected.size).toBe(0);
  });

  it('startDragging clones selection with ctrl when entry is draggable', () => {
    const { ds } = createDataSource();
    const dragHandleSpy: DragHandleSpy = vi.fn();
    const sketcher: Sketcher = {
      invalidate: () => true,
      setChartStyle: () => {},
      contextmenu: () => [],
      dragHandle: () => dragHandleSpy,
    };
    const { viewport } = createViewport(ds, sketcher);

    const entry = addEntry(ds, { id: 'line1', data: {}, type: 'line', locked: false, visible: true });
    entry.drawing = {
      handles: { h1: { render: () => {}, hitTest: () => false, cx: 0, cy: 0 } },
      parts: [],
    };

    viewport.highlighted = entry;
    viewport.selected.add(entry);

    const beginSpy = vi.spyOn(ds, 'beginTransaction');

    viewport.startDragging({ isCtrlPressed: true } as MouseClickEvent);

    expect(beginSpy).toHaveBeenCalled();
    expect(viewport.dragHandle).toBeDefined();
    const [selectedEntry] = Array.from(viewport.selected);
    expect(selectedEntry).not.toBe(entry);
    expect(selectedEntry?.descriptor.ref).not.toEqual(entry.descriptor.ref);
  });

  it('startDragging opens move transaction when selection is not draggable', () => {
    const { ds, manager } = createDataSource();
    const sketcher: Sketcher = {
      invalidate: () => true,
      setChartStyle: () => {},
      contextmenu: () => [],
      dragHandle: () => undefined,
    };
    const { viewport } = createViewport(ds, sketcher);

    const entry = addEntry(ds, { id: 'line1', data: {}, type: 'line', locked: true, visible: true });
    entry.drawing = {
      handles: {},
      parts: [],
    };

    viewport.highlighted = entry;
    viewport.selected.add(entry);

    const beginSpy = vi.spyOn(ds, 'beginTransaction');
    const openSpy = vi.spyOn(manager, 'openTransaction');

    viewport.startDragging({ isCtrlPressed: false } as MouseClickEvent);

    expect(beginSpy).not.toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith({ protocolTitle: 'move-in-viewport' });
  });

  it('drag moves selected entries and flushes datasource when drag handle exists', () => {
    const { ds } = createDataSource();
    const dragHandleSpy: DragHandleSpy = vi.fn();
    const sketcher: Sketcher = {
      invalidate: () => true,
      setChartStyle: () => {},
      contextmenu: () => [],
      dragHandle: () => dragHandleSpy,
    };
    const { viewport } = createViewport(ds, sketcher);

    const entry = addEntry(ds, { id: 'line1', data: {}, type: 'line', locked: false, visible: true });
    entry.drawing = {
      handles: { h1: { render: () => {}, hitTest: () => false, cx: 0, cy: 0 } },
      parts: [],
    };

    viewport.highlighted = entry;
    viewport.selected.add(entry);
    viewport.startDragging({ isCtrlPressed: false } as MouseClickEvent);

    const flushSpy = vi.spyOn(ds, 'flush');
    const invalidateSpy = vi.spyOn(viewport.highlightInvalidator, 'invalidate').mockImplementation(() => {});

    viewport.drag({ dx: 10, dy: -5 } as DragMoveEvent);

    expect(dragHandleSpy).toHaveBeenCalled();
    expect(flushSpy).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('drag pans axes when selection is not draggable', () => {
    const { ds } = createDataSource();
    const sketcher: Sketcher = {
      invalidate: () => true,
      setChartStyle: () => {},
      contextmenu: () => [],
      dragHandle: () => undefined,
    };

    const timeAxis = { move: vi.fn() } as unknown as TimeAxis;
    const priceAxis = {
      move: vi.fn(),
      isManualControlMode: vi.fn(() => true),
    } as unknown as PriceAxis;

    const { viewport } = createViewport(ds, sketcher, { timeAxis, priceAxis });

    const entry = addEntry(ds, { id: 'line1', data: {}, type: 'line', locked: true, visible: true });
    entry.drawing = { handles: {}, parts: [] };
    viewport.highlighted = entry;
    viewport.selected.add(entry);

    viewport.drag({ dx: 12, dy: -7 } as DragMoveEvent);

    expect(timeAxis.move).toHaveBeenCalledWith(12);
    expect(priceAxis.move).toHaveBeenCalledWith(-7);
  });

  it('endDragging closes correct transaction', () => {
    const { ds, manager } = createDataSource();
    const dragHandleSpy: DragHandleSpy = vi.fn();
    const sketcher: Sketcher = {
      invalidate: () => true,
      setChartStyle: () => {},
      contextmenu: () => [],
      dragHandle: () => dragHandleSpy,
    };
    const { viewport } = createViewport(ds, sketcher);

    const entry = addEntry(ds, { id: 'line1', data: {}, type: 'line', locked: false, visible: true });
    entry.drawing = { handles: { h1: { render: () => {}, hitTest: () => false, cx: 0, cy: 0 } }, parts: [] };
    viewport.highlighted = entry;
    viewport.selected.add(entry);
    viewport.startDragging({ isCtrlPressed: false } as MouseClickEvent);

    const endSpy = vi.spyOn(ds, 'endTransaction');
    viewport.endDragging();
    expect(endSpy).toHaveBeenCalled();

    const entry2 = addEntry(ds, { id: 'line2', data: {}, type: 'line', locked: true, visible: true });
    entry2.drawing = { handles: {}, parts: [] };
    viewport.highlighted = entry2;
    viewport.selected.clear();
    viewport.selected.add(entry2);

    const closeSpy = vi.spyOn(manager, 'tryCloseTransaction');
    viewport.startDragging({ isCtrlPressed: false } as MouseClickEvent);
    viewport.endDragging();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('removed entries are cleared from selection/highlight', () => {
    const { ds } = createDataSource();
    const sketcher: Sketcher = {
      invalidate: () => true,
      setChartStyle: () => {},
      contextmenu: () => [],
      dragHandle: () => undefined,
    };
    const { viewport } = createViewport(ds, sketcher);

    const entry = addEntry(ds, { id: 'line1', data: {}, type: 'line', locked: false, visible: true });
    entry.drawing = { handles: {}, parts: [] };

    viewport.highlighted = entry;
    viewport.highlightedHandleId = 'h1';
    viewport.cursor = 'pointer';
    viewport.selected.add(entry);

    viewport.installListeners();
    ds.beginTransaction();
    ds.remove(entry.descriptor.ref);
    ds.endTransaction();

    expect(viewport.selected.size).toBe(0);
    expect(viewport.highlighted).toBeUndefined();
    expect(viewport.highlightedHandleId).toBeUndefined();
    expect(viewport.cursor).toBeUndefined();
  });
});

describe('ViewportHighlightInvalidator', () => {
  function createLayerContext(): LayerContext {
    return {
      mainCanvas: {} as HTMLCanvasElement,
      utilityCanvasContext: {
        save: vi.fn(),
        restore: vi.fn(),
      } as unknown as CanvasRenderingContext2D,
      width: 100,
      height: 100,
      dpr: 1,
    };
  }

  it('prioritizes handle hit for selected entries', () => {
    const { ds } = createDataSource();
    const sketcher: Sketcher = {
      invalidate: () => true,
      setChartStyle: () => {},
      contextmenu: () => [],
      dragHandle: () => undefined,
    };
    const { viewport } = createViewport(ds, sketcher);
    viewport.highlightInvalidator.layerContext = createLayerContext();

    const entry = addEntry(ds, { id: 'line1', data: {}, type: 'line', locked: false, visible: true });
    entry.descriptor.visibleInViewport = true;
    entry.drawing = {
      handles: {
        h1: {
          render: () => {},
          hitTest: () => true,
          cursor: 'grab',
          cx: 0,
          cy: 0,
        },
      },
      parts: [
        { render: () => {}, hitTest: () => true },
      ],
    };

    viewport.selected.add(entry);

    viewport.updateHighlightes({ x: 10, y: 10 } as GenericMouseEvent);

    expect(viewport.highlighted).toBe(entry);
    expect(viewport.highlightedHandleId).toBe('h1');
    expect(viewport.cursor).toBe('grab');
  });

  it('falls back to body hit when no handle is hit', () => {
    const { ds } = createDataSource();
    const sketcher: Sketcher = {
      invalidate: () => true,
      setChartStyle: () => {},
      contextmenu: () => [],
      dragHandle: () => undefined,
    };
    const { viewport } = createViewport(ds, sketcher);
    viewport.highlightInvalidator.layerContext = createLayerContext();

    const entry = addEntry(ds, { id: 'line1', data: {}, type: 'line', locked: false, visible: true });
    entry.descriptor.visibleInViewport = true;
    entry.drawing = {
      handles: {
        h1: {
          render: () => {},
          hitTest: () => false,
          cx: 0,
          cy: 0,
        },
      },
      parts: [
        { render: () => {}, hitTest: () => true },
      ],
    };

    viewport.updateHighlightes({ x: 10, y: 10 } as GenericMouseEvent);

    expect(viewport.highlighted).toBe(entry);
    expect(viewport.highlightedHandleId).toBeUndefined();
    expect(viewport.cursor).toBe('pointer');
  });
});
