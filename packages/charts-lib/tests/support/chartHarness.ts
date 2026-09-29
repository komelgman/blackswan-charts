import { effectScope, nextTick, watch } from 'vue';
import { IdHelper } from '@blackswan/foundation';
import { layoutPanes, resizePanes } from '@blackswan/layout/model';
import type { LayerContext, MouseClickEvent, DragMoveEvent } from '@blackswan/layered-canvas/model';
import { Chart } from '@/model/chart/Chart';
import { Themes } from '@/model/chart/types/styles';
import DataSource from '@/model/datasource/DataSource';
import type { DrawingOptions, DrawingReference, DrawingType } from '@/model/datasource/types';
import { HLineSketcher, VLineSketcher, LineSketcher, type Sketcher } from '@/model/chart/viewport/sketchers';
import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';
import ViewportDataSourceLayer from '@/model/chart/viewport/layers/ViewportDataSourceLayer';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import { RecordingCanvas } from '@tests/support/RecordingCanvas';

export function createChartHarness({ render = true, priceScales }: { render?: boolean; priceScales?: Record<string, PriceAxisScale> } = {}) {
  const scope = effectScope();
  const canvases = new Map<string, RecordingCanvas>();
  const layers = new Map<string, ViewportDataSourceLayer>();
  const chart = scope.run(() => new Chart(new IdHelper(), {
    theme: Themes.DARK,
    sketchers: new Map<DrawingType, Sketcher>([
      ['HLine', new HLineSketcher()], ['VLine', new VLineSketcher()], ['Line', new LineSketcher()],
    ]),
    priceScales,
  }))!;
  const width = 800;
  const height = 600;
  function layerContext(canvas: RecordingCanvas, paneHeight: number): LayerContext {
    return {
      mainCanvas: { getContext: () => canvas.asContext() } as unknown as HTMLCanvasElement,
      utilityCanvasContext: canvas.asContext(), width, height: paneHeight, dpr: 1,
    };
  }
  function layout() {
    layoutPanes(chart.panes, height);
    chart.timeAxis.noHistoryManagedUpdate({ screenSize: { main: width, second: 30 } });
    for (const pane of chart.panes) {
      pane.model.priceAxis.noHistoryManagedUpdate({ screenSize: { main: pane.size ?? height, second: 60 } });
      const canvas = canvases.get(pane.id);
      if (canvas) layers.get(pane.id)!.updateContext(layerContext(canvas, pane.size ?? height));
    }
  }
  const removeRegistration = chart.addPaneRegistrationEventListener(({ type, pane }) => {
    if (type === 'install') {
      pane.model.installListeners();
      if (!render) return;
      // Vue mounts viewport layers after Chart has connected shared sources.
      void nextTick(() => scope.run(() => {
        if (!chart.panes.includes(pane)) return;
        const canvas = new RecordingCanvas();
        const layer = new ViewportDataSourceLayer(pane.model);
        layer.updateContext(layerContext(canvas, pane.size ?? height));
        layer.init();
        canvases.set(pane.id, canvas);
        layers.set(pane.id, layer);
      }));
    } else {
      layers.get(pane.id)?.destroy();
      layers.delete(pane.id);
      canvases.delete(pane.id);
      pane.model.uninstallListeners();
    }
  });
  scope.run(() => watch(() => chart.panes.map(p => [p.id, p.visible, p.preferredSize]), layout));

  function addPane(id: string, preferredSize?: number, drawings: DrawingOptions[] = []) {
    const ds = new DataSource({ id, idHelper: chart.idHelper }, drawings);
    scope.run(() => chart.createPane(ds, { preferredSize }));
    return ds;
  }
  function transact(ds: DataSource, action: () => void) {
    ds.beginTransaction();
    action();
    ds.endTransaction();
  }
  function resize(index: number, delta: number) {
    const visible = chart.panes.filter(p => p.visible);
    const result = resizePanes(visible, index, delta, height);
    chart.recordPaneResize({ source: { visibleItems: visible, invalidate: layout }, initial: result.initial, changed: result.changed });
  }
  function drag(viewport: Viewport, ref: DrawingReference | undefined, dx: number, dy: number, clone = false) {
    viewport.selected.clear();
    viewport.highlighted = ref === undefined ? undefined : viewport.dataSource.get(ref);
    viewport.startDragging({ isCtrlPressed: clone } as MouseClickEvent);
    viewport.drag({ dx, dy, x: 0, y: 0 } as DragMoveEvent);
    viewport.endDragging();
  }
  async function settle() {
    // Vue flushes nested model watchers; render timers are controlled by each test.
    await nextTick();
  }
  function dispose() {
    for (const pane of chart.panes) {
      pane.model.priceReference.stop();
      layers.get(pane.id)?.destroy();
      pane.model.uninstallListeners();
    }
    removeRegistration();
    scope.stop();
  }
  return { chart, addPane, transact, resize, drag, settle, dispose, canvases, width, height };
}

/** Detached values, including external projections omitted by the persistence serializer. */
export function observeChart(chart: Chart) {
  return JSON.parse(JSON.stringify({
    panes: chart.panes.map(p => ({
      id: p.id, visible: p.visible, size: p.size, preferredSize: p.preferredSize,
      price: { range: p.model.priceAxis.range, scale: p.model.priceAxis.scale.id, inverted: p.model.priceAxis.inverted.value,
        mode: p.model.priceAxis.controlMode.value },
      drawings: Array.from(p.model.dataSource, e => ({ ref: e.descriptor.ref, options: e.descriptor.options })),
    })),
    time: { range: chart.timeAxis.range, mode: chart.timeAxis.controlMode.value, follow: chart.timeAxis.isJustFollow() },
    style: chart.style,
  }));
}
