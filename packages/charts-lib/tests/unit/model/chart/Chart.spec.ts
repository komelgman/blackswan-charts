import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import { Chart } from '@/model/chart/Chart';
import DataSource from '@/model/datasource/DataSource';
import { IdHelper } from '@/model/misc/tools';
import { ControlMode } from '@/model/chart/axis/types';

async function createChartWithTwoPanes() {
  const idHelper = new IdHelper();
  const chart = new Chart(idHelper);
  const ds1 = new DataSource({ id: 'main', idHelper });
  const ds2 = new DataSource({ id: 'second', idHelper });

  chart.createPane(ds1);
  chart.createPane(ds2);
  await nextTick();

  return { chart, ds1, ds2 };
}

describe('Chart panes/timeAxis', () => {
  it('updates timeAxis primary entry based on visible pane priority', async () => {
    const idHelper = new IdHelper();
    const chart = new Chart(idHelper);
    const ds1 = new DataSource({ id: 'ds1', idHelper });
    const ds2 = new DataSource({ id: 'ds2', idHelper });

    const events: string[] = [];
    chart.addPaneRegistrationEventListener((e) => {
      events.push(`${e.type}:${e.pane.id}`);
    });

    chart.createPane(ds1, {
      priceAxis: {
        priority: 1,
        primaryEntry: 'entry-a',
      },
    });
    await nextTick();

    expect(events).toEqual(['install:ds1']);
    expect(chart.timeAxis.primaryEntryRef.value?.entryRef).toBe('entry-a');
    expect(chart.timeAxis.controlMode.value).toBe(ControlMode.MANUAL);

    chart.createPane(ds2, {
      priceAxis: {
        priority: 5,
        primaryEntry: 'entry-b',
      },
    });
    await nextTick();

    expect(events).toEqual(['install:ds1', 'install:ds2']);
    expect(chart.timeAxis.primaryEntryRef.value?.entryRef).toBe('entry-b');
    expect(chart.timeAxis.controlMode.value).toBe(ControlMode.AUTO);

    chart.togglePane(ds2.id);
    await nextTick();

    expect(chart.timeAxis.primaryEntryRef.value?.entryRef).toBe('entry-a');

    chart.togglePane(ds2.id);
    await nextTick();

    expect(chart.timeAxis.primaryEntryRef.value?.entryRef).toBe('entry-b');

    chart.removePane(ds2.id);
    await nextTick();

    expect(events).toEqual(['install:ds1', 'install:ds2', 'uninstall:ds2']);
    expect(chart.timeAxis.primaryEntryRef.value?.entryRef).toBe('entry-a');
  });

  it('clearHistory prevents undoing initial pane', async () => {
    const idHelper = new IdHelper();
    const chart = new Chart(idHelper);
    const mainDs = new DataSource({ id: 'main', idHelper });

    chart.createPane(mainDs);
    await nextTick();

    chart.clearHistory();

    const secondDs = new DataSource({ id: 'second', idHelper });
    chart.createPane(secondDs);
    await nextTick();

    expect(chart.panes.map((p) => p.id)).toEqual(['main', 'second']);

    chart.undo();
    await nextTick();

    expect(chart.panes.map((p) => p.id)).toEqual(['main']);
    expect(chart.isCanUndo).toBe(false);

    chart.undo();
    await nextTick();

    expect(chart.panes.map((p) => p.id)).toEqual(['main']);
  });

  it('swap panes is undoable', async () => {
    const { chart, ds1, ds2 } = await createChartWithTwoPanes();

    expect(chart.panes.map((p) => p.id)).toEqual([ds1.id, ds2.id]);

    chart.swapPanes(ds1.id, ds2.id);
    await nextTick();

    expect(chart.panes.map((p) => p.id)).toEqual([ds2.id, ds1.id]);

    chart.undo();
    await nextTick();

    expect(chart.panes.map((p) => p.id)).toEqual([ds1.id, ds2.id]);

    chart.redo();
    await nextTick();

    expect(chart.panes.map((p) => p.id)).toEqual([ds2.id, ds1.id]);
  });

  it('toggle pane is undoable', async () => {
    const { chart, ds2 } = await createChartWithTwoPanes();

    const getPane = () => chart.panes.find((p) => p.id === ds2.id);

    chart.togglePane(ds2.id);
    await nextTick();

    expect(getPane()?.visible).toBe(false);

    chart.undo();
    await nextTick();

    expect(getPane()?.visible).toBe(true);

    chart.redo();
    await nextTick();

    expect(getPane()?.visible).toBe(false);
  });

  it('remove pane is undoable', async () => {
    const { chart, ds1, ds2 } = await createChartWithTwoPanes();

    chart.removePane(ds2.id);
    await nextTick();

    expect(chart.panes.map((p) => p.id)).toEqual([ds1.id]);

    chart.undo();
    await nextTick();

    expect(chart.panes.map((p) => p.id)).toEqual([ds1.id, ds2.id]);

    chart.redo();
    await nextTick();

    expect(chart.panes.map((p) => p.id)).toEqual([ds1.id]);
  });
});
