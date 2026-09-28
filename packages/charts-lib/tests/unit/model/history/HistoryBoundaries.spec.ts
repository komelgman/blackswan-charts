import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { Chart } from '@/model/chart/Chart';
import DataSource from '@/model/datasource/DataSource';
import { IdHelper } from '@blackswan/foundation';

async function fixture() {
  const idHelper = new IdHelper();
  const chart = new Chart(idHelper);
  const drawing = () => ({ id: 'HLine1', type: 'HLine', data: { def: 0 }, locked: false, visible: true });
  const left = new DataSource({ id: 'left', idHelper }, [drawing()]);
  const right = new DataSource({ id: 'right', idHelper }, [drawing()]);
  chart.createPane(left);
  chart.createPane(right);
  await nextTick();
  chart.clearHistory();
  return { chart, left, right };
}

describe('History boundaries', () => {
  it.each([0, 1, 2])('clearHistory clears both directions after %i undos without changing the chart', async (undos) => {
    const { chart } = await fixture();
    chart.swapPanes('left', 'right');
    chart.togglePane('right');
    for (let i = 0; i < undos; i++) chart.undo();
    await nextTick();
    const before = chart.panes.map(p => ({ id: p.id, visible: p.visible }));
    chart.clearHistory();
    expect(chart.panes.map(p => ({ id: p.id, visible: p.visible }))).toEqual(before);
    expect(chart.isCanUndo).toBe(false);
    expect(chart.isCanRedo).toBe(false);
    chart.swapPanes('left', 'right');
    chart.undo();
    expect(chart.panes.map(p => ({ id: p.id, visible: p.visible }))).toEqual(before);
    expect(chart.isCanUndo).toBe(false);
  });

  it('updates equal local IDs in different sources independently inside one transaction', async () => {
    const { chart, left, right } = await fixture();
    chart.transactionManager.openTransaction({ protocolTitle: 'two-sources' });
    left.beginTransaction();
    left.update('HLine1', { title: 'left changed' });
    left.endTransaction();
    right.beginTransaction();
    right.update('HLine1', { title: 'right changed' });
    right.endTransaction();
    chart.transactionManager.tryCloseTransaction();
    const titles = () => [left, right].map(ds => ds.get('HLine1').descriptor.options.title);
    expect(titles()).toEqual(['left changed', 'right changed']);
    const changed = [vi.fn(), vi.fn()];
    left.addChangeEventListener(changed[0]);
    right.addChangeEventListener(changed[1]);
    chart.undo();
    expect(titles()).toEqual([undefined, undefined]);
    changed.forEach(listener => { expect(listener).toHaveBeenCalledTimes(1); listener.mockClear(); });
    chart.redo();
    expect(titles()).toEqual(['left changed', 'right changed']);
    changed.forEach(listener => expect(listener).toHaveBeenCalledTimes(1));
  });
});
