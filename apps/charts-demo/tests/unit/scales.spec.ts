import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { effectScope, nextTick, type EffectScope } from 'vue';
import { ControlMode, type Chart, type Line } from 'blackswan-charts';
import createScales from '@demo/gallery/examples/scales';
import { time } from '@demo/gallery/data';
import type { ExampleScene } from '@demo/gallery/types';

let scope: EffectScope;
let scenes: ExampleScene[];
beforeEach(() => {
  scope = effectScope();
  scenes = [];
  // Public sketchers build path caches; no canvas rendering or hit testing is needed here.
  vi.stubGlobal('Path2D', class { moveTo() {} lineTo() {} arc() {} });
});
afterEach(() => {
  scenes.forEach(scene => {
    scene.dispose?.();
    scene.chart.panes.forEach(pane => pane.model.priceReference.stop());
  });
  scope.stop();
  vi.unstubAllGlobals();
});

async function settle(chart: Chart) {
  chart.timeAxis.noHistoryManagedUpdate({ screenSize: { main: 800, second: 30 } });
  const viewport = chart.paneModel('main');
  viewport.priceAxis.noHistoryManagedUpdate({ screenSize: { main: 400, second: 60 } });
  for (let pass = 0; pass < 3; pass++) {
    const entries = Array.from(viewport.dataSource).filter(entry => entry.descriptor.options.type === 'OHLCv');
    entries.forEach(entry => viewport.getSketcher(entry.descriptor.options.type).invalidate(entry, viewport.projection));
    viewport.dataSource.invalidated(entries);
    await nextTick();
  }
}
async function create() {
  const scene = scope.run(createScales)!;
  scenes.push(scene);
  await nextTick();
  await settle(scene.chart);
  return scene;
}
function lineState(chart: Chart) {
  const source = chart.paneModel('main').dataSource;
  return ['Line1', 'Line2'].map(id => {
    const data = source.get<Line>(id).descriptor.options.data;
    return { def: [...data.def], scale: data.scale.id, style: { ...data.style } };
  });
}
function projectedTypes(chart: Chart) {
  const viewport = chart.paneModel('main');
  return ['Line1', 'Line2'].map(id => {
    const entry = viewport.dataSource.get<Line>(id);
    expect(viewport.getSketcher('Line').invalidate(entry, viewport.projection)).toBe(true);
    return entry.drawing!.parts[0].type;
  });
}

it('projects equal endpoints in fixed linear/log spaces while axis switches, undo and reset preserve drawing data', async () => {
  const scene = await create();
  const chart = scene.chart;
  const axis = chart.paneModel('main').priceAxis;
  const initial = lineState(chart);
  expect(initial.map(line => line.def)).toEqual([
    [time(8), 20, time(112), 1000],
    [time(8), 20, time(112), 1000],
  ]);
  expect(initial.map(line => line.scale)).toEqual(['regular', 'log10']);
  expect(initial.map(line => line.style.color)).toEqual(['#e2b77c', '#b5a0d5']);
  expect(projectedTypes(chart)).toEqual(['line', 'spline']);
  expect(chart.isCanUndo).toBe(false);

  for (const [label, scale, types] of [
    ['Logarithmic', 'log10', ['spline', 'line']],
    ['Percentage', 'percentage', ['line', 'spline']],
    ['Linear', 'regular', ['line', 'spline']],
  ] as const) {
    scene.actions!.find(action => action.label === label)!.run();
    await settle(chart);
    expect(axis.scale.id).toBe(scale);
    expect(axis.controlMode.value).toBe(ControlMode.AUTO);
    expect(lineState(chart)).toEqual(initial);
    // The real public sketcher changes which interpolation becomes a curve.
    expect(projectedTypes(chart)).toEqual(types);
  }

  chart.undo();
  await settle(chart);
  expect(axis.scale.id).toBe('percentage');
  expect(lineState(chart)).toEqual(initial);
  chart.redo();
  await settle(chart);
  expect(axis.scale.id).toBe('regular');
  expect(axis.controlMode.value).toBe(ControlMode.AUTO);
  expect(lineState(chart)).toEqual(initial);

  const reset = await create();
  expect(reset.chart).not.toBe(chart);
  expect(lineState(reset.chart)).toEqual(initial);
  expect(reset.chart.paneModel('main').priceAxis.scale.id).toBe('regular');
  expect(reset.chart.paneModel('main').priceAxis.controlMode.value).toBe(ControlMode.AUTO);
  expect(projectedTypes(reset.chart)).toEqual(['line', 'spline']);
  expect(reset.chart.isCanUndo).toBe(false);
});
