import { describe, expect, it, vi } from 'vitest';
import { DefaultChartUserInteractions } from '@/model/chart/user-interactions/DefaultChartUserInteractions';
import { ControlMode } from '@/model/chart/axis/types';
import type { Chart } from '@/model/chart/Chart';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type {
  DragMoveEvent,
  GenericMouseEvent,
  MouseClickEvent,
  ZoomEvent,
} from '@blackswan/layered-canvas/model';

describe('DefaultChartUserInteractions', () => {
  it('handles undo/redo on Ctrl/Cmd+Z', () => {
    const chart = {
      undo: vi.fn(),
      redo: vi.fn(),
    } as unknown as Chart;
    const interactions = new DefaultChartUserInteractions(chart);

    const undoEvent = {
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      code: 'KeyZ',
      preventDefault: vi.fn(),
    } as KeyboardEvent;

    interactions.onKeyDown(undoEvent);

    expect(undoEvent.preventDefault).toHaveBeenCalled();
    expect(chart.undo).toHaveBeenCalled();

    const redoEvent = {
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      code: 'KeyZ',
      preventDefault: vi.fn(),
    } as KeyboardEvent;

    interactions.onKeyDown(redoEvent);

    expect(redoEvent.preventDefault).toHaveBeenCalled();
    expect(chart.redo).toHaveBeenCalled();
  });

  it('delegates viewport interaction handlers', () => {
    const chart = { undo: vi.fn(), redo: vi.fn() } as unknown as Chart;
    const interactions = new DefaultChartUserInteractions(chart);

    const timeAxis = { screenSize: { main: 400 }, zoom: vi.fn() } as unknown as TimeAxis;
    const viewport = {
      updateHighlightes: vi.fn(),
      updateSelection: vi.fn(),
      startDragging: vi.fn(),
      drag: vi.fn(),
      endDragging: vi.fn(),
      timeAxis,
    } as unknown as Viewport;

    interactions.viewportInteractionsHandler.onMouseMove(viewport, { x: 1, y: 2 } as GenericMouseEvent);
    interactions.viewportInteractionsHandler.onLeftMouseBtnClick(viewport, { isCtrlPressed: true } as MouseClickEvent);
    interactions.viewportInteractionsHandler.onDragStart(viewport, { isCtrlPressed: false } as MouseClickEvent);
    interactions.viewportInteractionsHandler.onDrag(viewport, { dx: 5, dy: -5 } as DragMoveEvent);
    interactions.viewportInteractionsHandler.onDragEnd(viewport, { x: 0, y: 0 } as GenericMouseEvent);

    expect(viewport.updateHighlightes).toHaveBeenCalled();
    expect(viewport.updateSelection).toHaveBeenCalledWith(true);
    expect(viewport.startDragging).toHaveBeenCalled();
    expect(viewport.drag).toHaveBeenCalled();
    expect(viewport.endDragging).toHaveBeenCalled();

    interactions.viewportInteractionsHandler.onZoom(viewport, { x: 10, screenDelta: -1, isCtrlPressed: false } as ZoomEvent);
    expect(timeAxis.zoom).toHaveBeenCalledWith(400, -1);

    interactions.viewportInteractionsHandler.onZoom(viewport, { x: 20, screenDelta: 2, isCtrlPressed: true } as ZoomEvent);
    expect(timeAxis.zoom).toHaveBeenCalledWith(20, 2);
  });

  it('handles time axis interactions', () => {
    const chart = { undo: vi.fn(), redo: vi.fn() } as unknown as Chart;
    const interactions = new DefaultChartUserInteractions(chart);

    const timeAxis = {
      controlMode: ControlMode.MANUAL,
      screenSize: { main: 500 },
      zoom: vi.fn(),
    } as unknown as TimeAxis;

    interactions.timeAxisInteractionsHandler.onLeftMouseBtnDoubleClick(timeAxis, {} as MouseClickEvent);
    expect(timeAxis.controlMode).toBe(ControlMode.AUTO);

    interactions.timeAxisInteractionsHandler.onDrag(timeAxis, { dx: 12 } as DragMoveEvent);
    expect(timeAxis.zoom).toHaveBeenCalledWith(500, -12);

    interactions.timeAxisInteractionsHandler.onZoom(timeAxis, { x: 40, screenDelta: 3, isCtrlPressed: false } as ZoomEvent);
    expect(timeAxis.zoom).toHaveBeenCalledWith(500, 3);

    interactions.timeAxisInteractionsHandler.onZoom(timeAxis, { x: 50, screenDelta: -2, isCtrlPressed: true } as ZoomEvent);
    expect(timeAxis.zoom).toHaveBeenCalledWith(50, -2);
  });

  it('handles price axis interactions', () => {
    const chart = { undo: vi.fn(), redo: vi.fn() } as unknown as Chart;
    const interactions = new DefaultChartUserInteractions(chart);

    const priceAxis = {
      controlMode: ControlMode.MANUAL,
      zoom: vi.fn(),
    } as unknown as PriceAxis;

    interactions.priceAxisInteractionsHandler.onLeftMouseBtnDoubleClick(priceAxis, {} as MouseClickEvent);
    expect(priceAxis.controlMode).toBe(ControlMode.AUTO);

    interactions.priceAxisInteractionsHandler.onDrag(priceAxis, { dy: 10, elementHeight: 200 } as DragMoveEvent);
    expect(priceAxis.zoom).toHaveBeenCalledWith(100, -10);

    interactions.priceAxisInteractionsHandler.onZoom(priceAxis, { y: 42, screenDelta: -3 } as ZoomEvent);
    expect(priceAxis.zoom).toHaveBeenCalledWith(42, -3);
  });
});
