import { expect } from 'vitest';
import type { AsyncCommand } from 'fast-check';
import type { Price, UTCTimestamp } from '@/model/chart/types';
import type { createChartHarness } from './chartHarness';

type Drawing = { id: string; value: number; shared: boolean };
type Pane = { id: string; visible: boolean; inverted: number; scale: string; range: [number, number]; drawings: Drawing[] };
type State = { panes: Pane[]; time: [number, number] };
export type Model = { present: State; past: State[]; future: State[] };
export type Real = ReturnType<typeof createChartHarness>;
export type Action = 'add' | 'update' | 'remove' | 'addPane' | 'removePane' | 'toggle' | 'swap'
  | 'invert' | 'scale' | 'priceRange' | 'timeRange' | 'undo' | 'redo' | 'clear' | 'batch';

const pane = (id: string): Pane => ({ id, visible: true, inverted: -1, scale: 'regular', range: [-1, 1], drawings: [] });
export function initialModel(): Model { return { present: { panes: [pane('main')], time: [-1, 1] }, past: [], future: [] }; }

function project(state: State) {
  return {
    time: state.time,
    panes: state.panes.map(p => ({
      id: p.id, visible: p.visible, inverted: p.inverted, scale: p.scale, range: p.range,
      drawings: state.panes.flatMap(owner => owner.drawings
        .filter(d => owner.id === p.id || d.shared)
        .map(d => ({ key: `${owner.id}/${d.id}`, value: d.value, shared: d.shared })))
        .sort((a, b) => a.key.localeCompare(b.key)),
    })),
  };
}

export function assertModel(m: Model, r: Real) {
  const actual = {
    time: [r.chart.timeAxis.range.from, r.chart.timeAxis.range.to],
    panes: r.chart.panes.map(p => ({
      id: p.id, visible: p.visible, inverted: p.model.priceAxis.inverted.value,
      scale: p.model.priceAxis.scale.id, range: [p.model.priceAxis.range.from, p.model.priceAxis.range.to],
      drawings: Array.from(p.model.dataSource, ({ descriptor: { ref, options } }) => ({
        key: typeof ref === 'string' ? `${p.id}/${ref}` : `${ref[0]}/${ref[1]}`,
        value: options.data.def as number, shared: options.shareWith === '*',
      })).sort((a, b) => a.key.localeCompare(b.key)),
    })),
  };
  expect(actual).toEqual(project(m.present));
  expect(r.chart.isCanUndo).toBe(m.past.length > 0);
  expect(r.chart.isCanRedo).toBe(m.future.length > 0);
  for (const p of r.chart.panes) {
    const entries = new Set(p.model.dataSource);
    for (const selected of p.model.selected) expect(entries.has(selected)).toBe(true);
  }
}

/** The oracle stores plain snapshots; it does not use production incidents or merging. */
export class HistoryCommand implements AsyncCommand<Model, Real> {
  constructor(readonly action: Action, readonly source: number, readonly id: number, readonly value: number, readonly shared: boolean) {}
  private sourceId() { return ['main', 'second', 'third'][this.source]; }
  private drawingId() { return `vline${this.id}`; }
  check(m: Readonly<Model>): boolean {
    const p = m.present.panes.find(v => v.id === this.sourceId());
    const d = p?.drawings.find(v => v.id === this.drawingId());
    switch (this.action) {
      case 'undo': return m.past.length > 0;
      case 'redo': return m.future.length > 0;
      case 'clear': return true;
      case 'addPane': return !p;
      case 'removePane': case 'toggle': return !!p && p.id !== 'main';
      case 'swap': return !!p && p.id !== 'main';
      case 'add': return !!p && !d;
      case 'update': return !!d && d.value !== this.value / 10;
      case 'remove': return !!d;
      case 'batch': return m.present.panes.filter(v => v.drawings.some(x => x.id === this.drawingId())).length >= 2;
      case 'priceRange': return !!p && p.range[0] !== this.value;
      case 'timeRange': return m.present.time[0] !== this.value;
      case 'invert': case 'scale': return !!p;
    }
  }
  async run(m: Model, r: Real) {
    const action = this.action;
    if (action === 'undo') {
      m.future.push(structuredClone(m.present)); m.present = m.past.pop()!; r.chart.undo();
    } else if (action === 'redo') {
      m.past.push(structuredClone(m.present)); m.present = m.future.pop()!; r.chart.redo();
    } else if (action === 'clear') {
      m.past = []; m.future = []; r.chart.clearHistory();
    } else {
      const next = structuredClone(m.present);
      const p = next.panes.find(v => v.id === this.sourceId())!;
      const id = this.drawingId();
      const ds = () => r.chart.paneModel(this.sourceId()).dataSource;
      switch (action) {
        case 'addPane': next.panes.push(pane(this.sourceId())); r.addPane(this.sourceId()); break;
        case 'removePane': next.panes.splice(next.panes.indexOf(p), 1); r.chart.removePane(p.id); break;
        case 'toggle': p.visible = !p.visible; r.chart.togglePane(p.id); break;
        case 'swap': {
          const a = next.panes.indexOf(p); const b = next.panes.findIndex(v => v.id === 'main');
          [next.panes[a], next.panes[b]] = [next.panes[b], next.panes[a]];
          r.chart.swapPanes('main', p.id); break;
        }
        case 'add':
          p.drawings.push({ id, value: this.value / 10, shared: this.shared });
          r.transact(ds(), () => ds().add({
            id, type: 'VLine', data: { def: this.value / 10, style: { color: '#123456', lineWidth: 1, fill: 0 } },
            locked: false, visible: true, ...(this.shared ? { shareWith: '*' as const } : {}),
          })); break;
        case 'update':
          p.drawings.find(d => d.id === id)!.value = this.value / 10;
          r.transact(ds(), () => ds().update(id, { data: { def: this.value / 10 } })); break;
        case 'remove':
          p.drawings = p.drawings.filter(d => d.id !== id);
          r.transact(ds(), () => ds().remove(id)); break;
        case 'invert': p.inverted *= -1; r.chart.paneModel(p.id).priceAxis.invert(); break;
        case 'scale':
          p.scale = p.scale === 'regular' ? 'log10' : 'regular';
          r.chart.paneModel(p.id).priceAxis.scale = p.scale as 'regular' | 'log10'; break;
        case 'priceRange':
          p.range = [this.value, this.value + 10];
          r.chart.paneModel(p.id).priceAxis.range = { from: p.range[0] as Price, to: p.range[1] as Price }; break;
        case 'timeRange':
          next.time = [this.value, this.value + 10];
          r.chart.timeAxis.range = { from: next.time[0] as UTCTimestamp, to: next.time[1] as UTCTimestamp }; break;
        case 'batch': {
          r.chart.transactionManager.openTransaction({ protocolTitle: 'multi-source-update' });
          for (const owner of next.panes) {
            const d = owner.drawings.find(v => v.id === id);
            if (!d) continue;
            d.value += 1;
            const source = r.chart.paneModel(owner.id).dataSource;
            r.transact(source, () => source.update(id, { data: { def: d.value } }));
          }
          r.chart.transactionManager.tryCloseTransaction(); break;
        }
      }
      m.past.push(structuredClone(m.present)); m.present = next; m.future = [];
    }
    await r.settle();
    assertModel(m, r);
  }
  toString() { return `${this.action}(${this.sourceId()}, ${this.drawingId()}, ${this.value}, shared=${this.shared})`; }
}
