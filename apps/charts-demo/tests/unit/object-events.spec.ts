import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, type EffectScope } from 'vue';
import { ControlMode, type MouseClickEvent } from 'blackswan-charts';
import createEvents from '@demo/gallery/examples/events';
import type { ExampleScene } from '@demo/gallery/scene';

describe('object event example', () => {
  let scope: EffectScope;
  let scene: ExampleScene;
  const click: MouseClickEvent = {
    x: 200, y: 150, elementWidth: 800, elementHeight: 400,
    isCtrlPressed: false, isShiftPressed: false, isAltPressed: false,
  };

  beforeEach(async () => {
    vi.stubGlobal('Path2D', class { moveTo() {} lineTo() {} });
    scope = effectScope();
    scene = scope.run(createEvents)!;
    await nextTick();
  });
  afterEach(() => {
    scene.chart.panes.forEach(pane => pane.model.priceReference.stop());
    scope.stop();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('refreshes the hit and preserves ordinary selection and Ctrl-click toggling', () => {
    const viewport = scene.chart.paneModel('main');
    const entry = viewport.dataSource.get('HLine1');
    const hit = vi.spyOn(viewport, 'updateHighlightes').mockImplementation(() => {
      viewport.highlighted = entry;
      viewport.highlightedHandleId = 'center';
    });
    const handler = scene.chart.userInteractions.viewportInteractionsHandler;
    handler.onLeftMouseBtnClick(viewport, click);
    expect(hit).toHaveBeenCalledWith(click);
    expect(viewport.selected.has(entry)).toBe(true);
    expect(scene.objectEvent).toEqual({
      sourceId: 'main', drawingId: 'HLine1', drawingType: 'HLine',
      event: 'click', handle: 'center', x: 200, y: 150,
    });
    handler.onLeftMouseBtnClick(viewport, { ...click, isCtrlPressed: true });
    expect(viewport.selected.has(entry)).toBe(false);
    expect(scene.chart.isCanUndo).toBe(false);
  });

  it('uses the owner source for tuple references and hides when the hit is empty', () => {
    const viewport = scene.chart.paneModel('main');
    const entry = viewport.dataSource.get('HLine1');
    vi.spyOn(viewport, 'updateHighlightes').mockImplementation(() => {
      viewport.highlighted = {
        descriptor: { ...entry.descriptor, ref: ['owner', 'HLine1'] },
      };
    });
    const handler = scene.chart.userInteractions.viewportInteractionsHandler;
    handler.onLeftMouseBtnDoubleClick(viewport, click);
    expect(scene.objectEvent).toMatchObject({ sourceId: 'owner', drawingId: 'HLine1', event: 'dblclick' });
    vi.mocked(viewport.updateHighlightes).mockImplementation(() => { viewport.highlighted = undefined; });
    handler.onLeftMouseBtnClick(viewport, click);
    expect(scene.objectEvent).toBeUndefined();
    expect(viewport.selected.size).toBe(0);
  });

  it('dismisses the tooltip on drag and zoom while delegating normal chart behavior', () => {
    const viewport = scene.chart.paneModel('main');
    vi.spyOn(viewport, 'updateHighlightes').mockImplementation(() => {
      viewport.highlighted = viewport.dataSource.get('HLine1');
    });
    const drag = vi.spyOn(viewport, 'startDragging').mockImplementation(() => {});
    const zoom = vi.spyOn(viewport.timeAxis, 'zoom').mockImplementation(() => {});
    const handler = scene.chart.userInteractions.viewportInteractionsHandler;
    handler.onLeftMouseBtnClick(viewport, click);
    expect(scene.objectEvent).toBeDefined();
    handler.onDragStart(viewport, click);
    expect(scene.objectEvent).toBeUndefined();
    expect(drag).toHaveBeenCalledWith(click);
    handler.onLeftMouseBtnClick(viewport, click);
    handler.onZoom(viewport, { ...click, screenDelta: 1 });
    expect(scene.objectEvent).toBeUndefined();
    expect(zoom).toHaveBeenCalledOnce();
  });

  for (const axisName of ['time', 'price'] as const) {
    it(`dismisses details for ${axisName} axis navigation and preserves its zoom`, () => {
      const chart = scene.chart;
      const viewport = chart.paneModel('main');
      vi.spyOn(viewport, 'updateHighlightes').mockImplementation(() => {
        viewport.highlighted = viewport.dataSource.get('HLine1');
      });
      const interactions = chart.userInteractions;
      const axis = axisName === 'time' ? chart.timeAxis : viewport.priceAxis;
      axis.noHistoryManagedUpdate({ controlMode: ControlMode.MANUAL, screenSize: { main: 400, second: 30 } });
      const initialSpan = axis.range.to - axis.range.from;
      const zoom = vi.spyOn(axis, 'zoom');
      const event = { ...click, screenDelta: -1 };
      interactions.viewportInteractionsHandler.onLeftMouseBtnClick(viewport, click);
      expect(scene.objectEvent).toBeDefined();
      if (axisName === 'time') interactions.timeAxisInteractionsHandler.onDragStart(chart.timeAxis, click);
      else interactions.priceAxisInteractionsHandler.onDragStart(viewport.priceAxis, click);
      expect(scene.objectEvent).toBeUndefined();
      interactions.viewportInteractionsHandler.onLeftMouseBtnClick(viewport, click);
      if (axisName === 'time') interactions.timeAxisInteractionsHandler.onZoom(chart.timeAxis, event);
      else interactions.priceAxisInteractionsHandler.onZoom(viewport.priceAxis, event);
      expect(scene.objectEvent).toBeUndefined();
      expect(zoom).toHaveBeenCalledWith(axisName === 'time' ? 400 : click.y, -1);
      expect(axis.range.to - axis.range.from).toBeLessThan(initialSpan);
      expect(chart.isCanUndo).toBe(true);
    });
  }
});
