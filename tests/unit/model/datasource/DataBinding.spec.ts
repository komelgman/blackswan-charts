/* eslint-disable @typescript-eslint/no-unused-vars */
 
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clone } from '@/model/misc/object.clone';
import DataSource from '@/model/datasource/DataSource';
import {
  type DataSourceEntry,
  type DrawingOptions,
  type DrawingReference,
} from '@/model/datasource/types';
import { IdHelper } from '@/model/misc/tools';
import { Chart } from '@/model/chart/Chart';
import { DataBinding, type ContentOptions, type ExternalContent, type DataPipe } from '@/model/databinding';
import { DataSourceChangeEventReason, type DataSourceChangeEventsMap } from '@/model/datasource/events';

interface TestContentOptions extends ContentOptions<'TestContentOptions'> {
  contentKey: string;
  contentArgs?: string;
}

interface TestContentType {
  message: string;
}

interface TestDrawingOptions extends ExternalContent<TestContentOptions, TestContentType> { }

class TestDataPipe implements DataPipe<TestContentOptions, TestContentType> {
  getContentOptions(entry: DataSourceEntry): TestContentOptions | undefined {
    const contentOptions = entry.descriptor.options.data?.contentOptions;
    return this.canHandle(contentOptions) ? contentOptions : undefined;
  }

  canHandle(contentOptions?: TestContentOptions): boolean {
    return contentOptions?.type === 'TestContentOptions';
  }

  toContentKey(contentOptions: TestContentOptions): string {
    return contentOptions.contentKey;
  }

  subscribe(contentOptions: TestContentOptions, contentUpdateCallback: (contentKye: string, content: TestContentType) => void): void {
    const contentKey = this.toContentKey(contentOptions);
    contentUpdateCallback(contentKey, { message: contentKey.toUpperCase() });
  }

  updateSubscription(newContentOptions: TestContentOptions[]): void {
    // nothing
  }

  unsubscribe(contentKey: string): void {
    // nothing
  }

  getContent(contentKey: string): TestContentType {
    return { message: contentKey.toUpperCase() };
  }
}

describe('DataBinding', () => {
  let dataPipe: DataPipe<TestContentOptions, TestContentType>;
  let chart: Chart;
  let ds1: DataSource;
  let idHelper: IdHelper;

  const drawing1: DrawingOptions<TestDrawingOptions> = {
    id: 'test1',
    data: {
      contentOptions: {
        type: 'TestContentOptions',
        contentKey: 'test1.contentKey',
      },
    },
    type: 'test',
    locked: false,
    visible: true,
    shareWith: '*',
  };

  const drawing2: DrawingOptions<TestDrawingOptions> = {
    id: 'test2',
    data: {
      contentOptions: {
        type: 'TestContentOptions',
        contentKey: 'test2.contentKey',
      },
    },
    type: 'test',
    locked: false,
    visible: true,
  };

  const drawing3: DrawingOptions = {
    id: 'test3',
    data: 'test3 data',
    type: 'test',
    locked: false,
    visible: false,
    shareWith: '*',
  };

  const drawing4: DrawingOptions<TestDrawingOptions> = {
    id: 'test4',
    data: {
      contentOptions: {
        type: 'TestContentOptions',
        contentKey: 'test4.contentKey',
      },
    },
    type: 'test',
    locked: false,
    visible: false,
  };

  const drawing5: DrawingOptions<TestDrawingOptions> = {
    id: 'test5',
    data: {
      contentOptions: {
        type: 'TestContentOptions',
        contentKey: 'test4.contentKey',
      },
    },
    type: 'test',
    locked: false,
    visible: false,
  };

  beforeEach(async () => {
    idHelper = new IdHelper();
    ds1 = new DataSource({ idHelper }, clone([drawing1, drawing2, drawing3]));

    chart = new Chart(idHelper);
    ds1.resetCache();
    chart.createPane(ds1);
    dataPipe = new TestDataPipe();
  });

  it('should call pipe.startContentLoading when new DataBinding()', () => {
    const subscribeSpy = vi.spyOn(dataPipe, 'subscribe');

    const binding = new DataBinding(chart, dataPipe);

    expect(subscribeSpy).toHaveBeenCalledTimes(2);
    expect(subscribeSpy).toHaveBeenNthCalledWith(1, {
      contentKey: 'test1.contentKey',
      type: 'TestContentOptions',
    }, expect.any(Function));
    expect(subscribeSpy).toHaveBeenNthCalledWith(2, {
      contentKey: 'test2.contentKey',
      type: 'TestContentOptions',
    }, expect.any(Function));
  });

  it('should call pipe.startContentLoading once when chart.createPane() with entries with equal contentKey', () => {
    const subscribeSpy = vi.spyOn(dataPipe, 'subscribe');
    const binding = new DataBinding(chart, dataPipe);
    subscribeSpy.mockClear();

    const ds2 = new DataSource({ idHelper }, clone([drawing3, drawing4, drawing5]));
    chart.createPane(ds2);

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(subscribeSpy).toHaveBeenNthCalledWith(1, {
      contentKey: 'test4.contentKey',
      type: 'TestContentOptions',
    }, expect.any(Function));
  });

  it('should call pipe.startContentLoading when add new drawing to dataSource', () => {
    const subscribeSpy = vi.spyOn(dataPipe, 'subscribe');
    const binding = new DataBinding(chart, dataPipe);
    subscribeSpy.mockClear();

    ds1.beginTransaction();
    ds1.add(clone(drawing4));
    ds1.endTransaction();

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(subscribeSpy).toHaveBeenNthCalledWith(1, {
      contentKey: 'test4.contentKey',
      type: 'TestContentOptions',
    }, expect.any(Function));
  });

  it('should call pipe.getContent when add new drawing to dataSource with existing contentKey', () => {
    const getContentSpy = vi.spyOn(dataPipe, 'getContent');
    const binding = new DataBinding(chart, dataPipe);
    getContentSpy.mockClear();

    ds1.beginTransaction();
    ds1.add(clone(drawing4));
    ds1.add(clone(drawing5));
    ds1.endTransaction();

    expect(getContentSpy).toHaveBeenCalledTimes(1);
    expect(getContentSpy).toHaveBeenNthCalledWith(1, dataPipe.toContentKey(drawing5.data.contentOptions as any as TestContentOptions));
  });

  it('should call pipe.stopContentLoading when remove last entry with contentKey', () => {
    const unsubscribeSpy = vi.spyOn(dataPipe, 'unsubscribe');
    const binding = new DataBinding(chart, dataPipe);
    unsubscribeSpy.mockClear();
    ds1.beginTransaction();
    ds1.add(clone(drawing4));
    ds1.add(clone(drawing5));
    ds1.remove(drawing2.id);
    ds1.endTransaction();

    ds1.beginTransaction();
    ds1.remove(drawing4.id);
    ds1.endTransaction();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    expect(unsubscribeSpy).toHaveBeenNthCalledWith(1, dataPipe.toContentKey(drawing2.data.contentOptions as any as TestContentOptions));
  });

  it('should call pipe.stopContentLoading when remove pane', () => {
    const unsubscribeSpy = vi.spyOn(dataPipe, 'unsubscribe');
    const binding = new DataBinding(chart, dataPipe);
    ds1.beginTransaction();
    ds1.add(clone(drawing4));
    ds1.add(clone(drawing5));
    ds1.endTransaction();
    const ds2 = new DataSource({ idHelper }, clone([drawing3, drawing4, drawing5]));
    chart.createPane(ds2);
    unsubscribeSpy.mockClear();

    chart.removePane(ds1.id);

    expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
    expect(unsubscribeSpy).toHaveBeenNthCalledWith(1, dataPipe.toContentKey(drawing1.data.contentOptions as any as TestContentOptions));
    expect(unsubscribeSpy).toHaveBeenNthCalledWith(2, dataPipe.toContentKey(drawing2.data.contentOptions as any as TestContentOptions));
  });

  it('should call pipe.(stop|start)ContentLoading when update entry contentOptions', () => {
    const unsubscribeSpy = vi.spyOn(dataPipe, 'unsubscribe');
    const subscribeSpy = vi.spyOn(dataPipe, 'subscribe');
    const getContentSpy = vi.spyOn(dataPipe, 'getContent');
    const binding = new DataBinding(chart, dataPipe);
    unsubscribeSpy.mockClear();
    subscribeSpy.mockClear();
    getContentSpy.mockClear();

    ds1.beginTransaction();
    ds1.update(drawing1.id, {
      data: {
        contentOptions: {
          type: 'TestContentOptions',
          contentKey: 'newNonExists.ContntentKey',
        },
      },
    });
    ds1.endTransaction();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    expect(unsubscribeSpy).toHaveBeenNthCalledWith(1, dataPipe.toContentKey(drawing1.data.contentOptions as any as TestContentOptions));
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(subscribeSpy).toHaveBeenNthCalledWith(1, {
      contentKey: 'newNonExists.ContntentKey',
      type: 'TestContentOptions',
    }, expect.any(Function));
    expect(getContentSpy).toHaveBeenCalledTimes(0);
  });

  it('should call pipe.stopContentLoading and pipe.getContent when update entry contentOptions', () => {
    const unsubscribeSpy = vi.spyOn(dataPipe, 'unsubscribe');
    const subscribeSpy = vi.spyOn(dataPipe, 'subscribe');
    const getContentSpy = vi.spyOn(dataPipe, 'getContent');
    const binding = new DataBinding(chart, dataPipe);
    unsubscribeSpy.mockClear();
    subscribeSpy.mockClear();
    getContentSpy.mockClear();

    ds1.beginTransaction();
    ds1.update(drawing1.id, {
      data: {
        contentOptions: {
          type: 'TestContentOptions',
          contentKey: drawing2.data.contentOptions?.contentKey,
        },
      },
    });
    ds1.endTransaction();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    expect(unsubscribeSpy).toHaveBeenNthCalledWith(1, dataPipe.toContentKey(drawing1.data.contentOptions as any as TestContentOptions));
    expect(subscribeSpy).toHaveBeenCalledTimes(0);
    expect(getContentSpy).toHaveBeenCalledTimes(1);
    expect(getContentSpy).toHaveBeenNthCalledWith(1, dataPipe.toContentKey(drawing2.data.contentOptions as any as TestContentOptions));
  });

  it('should call pipe.updateLoaderOptions when update entry contentOptions', () => {
    const unsubscribeSpy = vi.spyOn(dataPipe, 'unsubscribe');
    const subscribeSpy = vi.spyOn(dataPipe, 'subscribe');
    const updateSubscriptionSpy = vi.spyOn(dataPipe, 'updateSubscription');
    const binding = new DataBinding(chart, dataPipe);
    const ds2 = new DataSource({ idHelper }, clone([drawing1, drawing3, drawing4, drawing5]));
    chart.createPane(ds2);

    unsubscribeSpy.mockClear();
    subscribeSpy.mockClear();
    updateSubscriptionSpy.mockClear();

    ds2.beginTransaction();
    ds2.update(drawing4.id, {
      data: {
        contentOptions: {
          contentArgs: 'some value',
        },
      },
    });
    ds2.endTransaction();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(0);
    expect(subscribeSpy).toHaveBeenCalledTimes(0);
    expect(updateSubscriptionSpy).toHaveBeenCalledTimes(1);
    expect(updateSubscriptionSpy).toHaveBeenNthCalledWith(1, [{
      type: 'TestContentOptions',
      contentKey: drawing4.data.contentOptions?.contentKey,
      contentArgs: 'some value',
    }, {
      type: 'TestContentOptions',
      contentKey: drawing5.data.contentOptions?.contentKey,
    }]);
  });

  it('should call pipe.updateLoaderOptions when process entry contentOptions', () => {
    const unsubscribeSpy = vi.spyOn(dataPipe, 'unsubscribe');
    const subscribeSpy = vi.spyOn(dataPipe, 'subscribe');
    const updateSubscriptionSpy = vi.spyOn(dataPipe, 'updateSubscription');
    const binding = new DataBinding(chart, dataPipe);
    const ds2 = new DataSource({ idHelper }, clone([drawing1, drawing3, drawing4, drawing5]));
    chart.createPane(ds2);

    unsubscribeSpy.mockClear();
    subscribeSpy.mockClear();
    updateSubscriptionSpy.mockClear();

    ds2.beginTransaction();
    ds2.noHistoryManagedEntriesProcess(
      [drawing4.id],
      (e: DataSourceEntry) => {
        e.descriptor.options.data.contentOptions.contentArgs = 'some value';
      },
      DataSourceChangeEventReason.DataInvalid,
    );
    ds2.endTransaction();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(0);
    expect(subscribeSpy).toHaveBeenCalledTimes(0);
    expect(updateSubscriptionSpy).toHaveBeenCalledTimes(1);
    expect(updateSubscriptionSpy).toHaveBeenNthCalledWith(1, [{
      type: 'TestContentOptions',
      contentKey: drawing4.data.contentOptions?.contentKey,
      contentArgs: 'some value',
    }, {
      type: 'TestContentOptions',
      contentKey: drawing5.data.contentOptions?.contentKey,
    }]);
  });

  it('should update entries in DataSource when updateContent called', () => {
    const binding = new DataBinding(chart, dataPipe);
    const dsEvents: DataSourceChangeEventsMap = new Map();
    const options: any = {
      dsEventListener: (events: DataSourceChangeEventsMap): void => {
        for (const [key, value] of events) {
          if (dsEvents.has(key)) {
            dsEvents.get(key)?.push(...value);
          } else {
            dsEvents.set(key, value);
          }
        }
      },
    };
    const dsEventListenerSpy = vi.spyOn(options, 'dsEventListener');
    const contentKey = dataPipe.toContentKey(drawing4.data.contentOptions as any as TestContentOptions);
    const ds2 = new DataSource({ idHelper }, clone([drawing1, drawing3, drawing4, drawing5]));
    chart.createPane(ds2);
    ds2.addChangeEventListener(options.dsEventListener);

    binding['updateContent'].call(binding, contentKey, { message: 'some content' });

    expect(dsEventListenerSpy).toHaveBeenCalledTimes(2);
    expect(toRefsFromEventsMap(dsEvents, DataSourceChangeEventReason.UpdateEntry))
      .toEqual([drawing4.id, drawing5.id]);
  });

  it('test unbind', () => {
    const unsubscribeSpy = vi.spyOn(dataPipe, 'unsubscribe');
    const chartSpy = vi.spyOn(chart, 'removePaneRegistrationEventListener');
    const dsSpy = vi.spyOn(ds1, 'removeChangeEventListener');
    const binding = new DataBinding(chart, dataPipe);

    binding.unbind();

    expect(chartSpy).toHaveBeenCalledOnce();
    expect(dsSpy).toHaveBeenCalledOnce();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
    expect(unsubscribeSpy).toHaveBeenNthCalledWith(1, dataPipe.toContentKey(drawing1.data.contentOptions as any as TestContentOptions));
    expect(unsubscribeSpy).toHaveBeenNthCalledWith(2, dataPipe.toContentKey(drawing2.data.contentOptions as any as TestContentOptions));
  });

  function toRefsFromEventsMap(events: DataSourceChangeEventsMap, reason: DataSourceChangeEventReason): DrawingReference[] {
    if (events === undefined) {
      return [];
    }

    return (events.get(reason) || []).map((event) => (event.entry.descriptor.ref));
  }
});
