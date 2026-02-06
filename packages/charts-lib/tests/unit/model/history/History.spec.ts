import { describe, expect, it } from 'vitest';
import {
  History,
  HistoricalProtocolSign,
  HistoricalTransactionManager,
  type HistoricalIncident,
  type IsEmptyIncident,
} from '@/model/history';
import { IdHelper } from 'blackswan-foundation';
import DataSource from '@/model/datasource/DataSource';
import type { DrawingOptions } from '@/model/datasource/types';

class CounterIncident implements HistoricalIncident {
  public constructor(private readonly counter: { value: number }, private readonly delta: number) {}

  public apply(): void {
    this.counter.value += this.delta;
  }

  public inverse(): void {
    this.counter.value -= this.delta;
  }
}

class EmptyIncident implements HistoricalIncident, IsEmptyIncident {
  public apply(): void {}

  public inverse(): void {}

  public isEmptyIncident(): boolean {
    return true;
  }
}

describe('History', () => {
  it('signs previous protocol when title changes', () => {
    const history = new History();
    const counter = { value: 0 };

    history.addReport({
      protocolOptions: { protocolTitle: 'protocol-A' },
      incident: new CounterIncident(counter, 1),
    });

    expect(counter.value).toBe(1);
    const protocolA = (history as any)['currentProtocol'];
    expect(protocolA.title).toBe('protocol-A');
    expect(protocolA.sign).toBe(HistoricalProtocolSign.NotSigned);

    history.addReport({
      protocolOptions: { protocolTitle: 'protocol-B' },
      incident: new CounterIncident(counter, 2),
    });

    const protocolB = (history as any)['currentProtocol'];
    expect(protocolB.title).toBe('protocol-B');
    expect(protocolB.prev?.sign).toBe(HistoricalProtocolSign.Approved);
    expect(counter.value).toBe(3);
  });

  it('undo signs and inverses unsigned protocol', () => {
    const history = new History();
    const counter = { value: 0 };

    history.addReport({
      protocolOptions: { protocolTitle: 'unsigned' },
      incident: new CounterIncident(counter, 1),
    });

    expect(counter.value).toBe(1);

    history.undo();

    expect(counter.value).toBe(0);
    expect(history.isCanRedo).toBe(true);

    history.redo();

    expect(counter.value).toBe(1);
  });

  it('rejects empty protocol and keeps history clean', () => {
    const history = new History();

    history.addReport({
      protocolOptions: { protocolTitle: 'empty' },
      incident: new EmptyIncident(),
      sign: true,
    });

    expect(history.isCanUndo).toBe(false);
    expect((history as any)['currentProtocol'].title).toBe('big-boom');
  });
});

describe('HistoricalTransactionManager', () => {
  it('throws on invalid close and non-propagated nested transaction', () => {
    const history = new History();
    const idHelper = new IdHelper();
    const manager = new HistoricalTransactionManager(idHelper, history);
    const counter = { value: 0 };

    expect(() => manager.tryCloseTransaction()).toThrowError(/IllegalState/);

    manager.openTransaction({ protocolTitle: 'tx-1' });

    expect(() => manager.openTransaction({ protocolTitle: 'tx-2' }, { propagate: false }))
      .toThrowError(/IllegalState/);

    manager.exeucteInTransaction({
      incident: new CounterIncident(counter, 5),
    });

    manager.tryCloseTransaction({ signOnClose: false });

    const protocol = (history as any)['currentProtocol'];
    expect(counter.value).toBe(5);
    expect(protocol.title).toBe('tx-1');
    expect(protocol.sign).toBe(HistoricalProtocolSign.NotSigned);
  });
});

describe('UpdateEntry merge', () => {
  it('merges updates for the same entry inside one transaction', () => {
    const idHelper = new IdHelper();
    const history = new History();
    const manager = new HistoricalTransactionManager(idHelper, history);
    const drawing: DrawingOptions = {
      id: 'test1',
      data: '',
      type: 'test',
      locked: false,
      visible: true,
    };

    const ds = new DataSource({ id: 'ds1', idHelper }, [drawing]);
    ds.transactionManager = manager;

    ds.beginTransaction({ protocolTitle: 'merge-update' });
    ds.update(drawing.id, { title: 'v1' });
    ds.update(drawing.id, { locked: true });
    ds.endTransaction();

    const protocol = (history as any)['currentProtocol'];
    const incidents = protocol['incidents'] as unknown[];

    expect(protocol.sign).toBe(HistoricalProtocolSign.Approved);
    expect(incidents.length).toBe(1);

    const updated = ds.get(drawing.id);
    expect(updated.descriptor.options.title).toBe('v1');
    expect(updated.descriptor.options.locked).toBe(true);

    history.undo();

    const reverted = ds.get(drawing.id);
    expect(reverted.descriptor.options.title).toBeUndefined();
    expect(reverted.descriptor.options.locked).toBe(false);
  });
});
