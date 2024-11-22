<template>
  <chart-widget :chart="chartApi"/>
</template>

<script lang="ts" setup>
import { isProxy, markRaw } from 'vue';
import ChartWidget from '@/components/chart/ChartWidget.vue';
import { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';
import { Chart } from '@/model/chart/Chart';
import type { Sketcher } from '@/model/chart/viewport/sketchers';
import DataSource from '@/model/datasource/DataSource';
import { DataSourceChangeEventReason, type DataSourceChangeEventsMap } from '@/model/datasource/events';
import type { DrawingOptions, DrawingType } from '@/model/datasource/types';
import { IdHelper, type IdBuilder } from '@/model/tools';
import type { Line, OHLCv, OHLCvContentOptions, OHLCvRecord, Price, UTCTimestamp } from '@/model/chart/types';
import {
  LineBound,
  OHLCV_RECORD_CLOSE,
} from '@/model/chart/types';
import type { CandlestickPlot, ColumnsVolumeIndicator } from '@/model/chart/viewport/sketchers/renderers';
import { DataBinding, type ContentProviderFabric } from '@/model/databinding';
import { OHLCvPipe } from '@/model/databinding/pipes/OHLCvPipe';
import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';
import { ControlMode } from '@/model/chart/axis/types';
import { shadeColor } from '@/misc/color';
import { TIME_PERIODS_MAP, TimePeriods } from '@/model/chart/types/time';

/**
 * todo
 * ?need check, that is actually needed!
 * Separate line bounds and line definition, snap definition to high timeframe, to eliminate rounding issues
 *
 * Time axis marks
 * Price axis marks
 * Moving lines in scale that's different to line scale (mouse point should keep on line)
 */

function getRandomColor(): string {
  // eslint-disable-next-line no-bitwise
  return `#${(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')}`;
}

function getLineWidth(): number {
  return Math.floor(Math.random() * 5) + 1;
}

function getFill(): number {
  return Math.floor(Math.random() * 5);
}

function getScale(): PriceAxisScale {
  return [PriceScales.regular, PriceScales.log10][Math.floor(Math.random() * 2)];
}

function getLineBound(): LineBound {
  return [LineBound.NoBound, LineBound.Both, LineBound.BoundEnd, LineBound.BoundStart][Math.floor(Math.random() * 4)];
}

const tp = TIME_PERIODS_MAP.get(TimePeriods.h1);
if (!tp) {
  throw new Error('Oops');
}
const m1Duration: number = tp.averageBarDuration;

function getRandomVLine(idBuilder: IdBuilder) {
  return {
    id: idBuilder.getNewId('VLine'),
    title: 'vline',
    type: 'VLine',
    data: {
      def: Math.random() * 10 * m1Duration - 5 * m1Duration,
      style: {
        lineWidth: getLineWidth(),
        fill: getFill(),
        color: getRandomColor(),
      },
    },
    locked: false,
    visible: true,
  };
}

function getRandomHLine(idBuilder: IdBuilder) {
  return {
    id: idBuilder.getNewId('HLine'),
    title: 'hline',
    type: 'HLine',
    data: {
      def: Math.random() * 1 - 0.5,
      style: {
        lineWidth: getLineWidth(),
        fill: getFill(),
        color: getRandomColor(),
      },
    },
    locked: false,
    visible: true,
  };
}

function getRandomLine(idBuilder: IdBuilder) {
  return {
    id: idBuilder.getNewId('Line'),
    title: 'line',
    type: 'Line',
    data: {
      def: [
        Math.random() * 100 * m1Duration - 50 * m1Duration,
        Math.random() * 5 - 10,
        Math.random() * 100 * m1Duration - 50 * m1Duration,
        Math.random() * 5 - 10,
      ],
      boundType: getLineBound(),
      scale: getScale(),
      style: {
        lineWidth: getLineWidth(),
        fill: getFill(),
        color: getRandomColor(),
      },
    },
    locked: false,
    visible: true,
    shareWith: '*' as '*',
  };
}

function getRandomDrawing(idBuilder: IdBuilder): any {
  return [getRandomLine, getRandomVLine, getRandomHLine][Math.floor(Math.random() * 3)](idBuilder);
}

const idHelper: IdHelper = new IdHelper();
const randomDrawings = new Array(0).fill(null).map(() => getRandomDrawing(idHelper.forGroup('test')));
const mainDs = new DataSource({ id: 'main', idHelper }, randomDrawings);
const chartApi = new Chart(idHelper, {
  sketchers: new Map<DrawingType, Sketcher>([]),
  style: {},
});

const drawings = {
  ohlcvBTCUSDT: {
    id: 'ohlcv1',
    title: 'BTCUSDT',
    type: 'OHLCv',
    data: {
      contentOptions: {
        type: 'OHLCvContentOptions',
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
        step: TimePeriods.h1,
      },
      plotOptions: {
        type: 'CandlestickPlot',
        barStyle: {
          showBody: true,
          showBorder: true,
          showWick: true,
          bearish: {
            wick: '#EF5350',
            body: '#EF5350',
            border: '#EF5350',
          },
          bullish: {
            wick: '#26A29A',
            body: '#26A29A',
            border: '#26A29A',
          },
        },
      },
    },
    locked: false,
    visible: true,
    shareWith: '*',
  } as DrawingOptions<CandlestickPlot>,

  volumeBTCUSDT: {
    id: 'ohlcv2',
    title: 'BTCUSDT Volume',
    type: 'OHLCv',
    data: {
      contentOptions: {
        type: 'OHLCvContentOptions',
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
        step: TimePeriods.h1,
      },
      plotOptions: {
        type: 'VolumeIndicator',
        style: {
          type: 'Columns',
          bearish: {
            body: shadeColor('#EF5350', 1.3),
            border: shadeColor('#EF5350', 1.5),
          },
          bullish: {
            body: shadeColor('#26A29A', 1.3),
            border: shadeColor('#26A29A', 1.5),
          },
        },
      },
    },
    locked: false,
    visible: true,
    shareWith: '*',
  } as DrawingOptions<ColumnsVolumeIndicator>,

  redLineNoBound: {
    id: 'line1',
    title: 'line1',
    type: 'Line',
    data: {
      def: [-1 * 10 * m1Duration, -0.25, 1 * 10 * m1Duration, 0.75],
      boundType: LineBound.NoBound,
      scale: PriceScales.log10,
      style: { lineWidth: 2, fill: 1, color: '#AA0000' },
    } as Line,
    locked: false,
    visible: true,
    shareWith: '*' as '*',
  },

  greenLineBoundBoth: {
    id: 'line2',
    title: 'line2',
    type: 'Line',
    data: {
      def: [0, 0.75, 0.75 * 10 * m1Duration, 0.75],
      boundType: LineBound.Both,
      scale: PriceScales.regular,
      style: { lineWidth: 2, fill: 1, color: '#00AA00' },
    } as Line,
    locked: false,
    visible: true,
    shareWith: '*' as '*',
  },

  greenLineBoundStart: {
    id: 'line3',
    title: 'line3',
    type: 'Line',
    data: {
      def: [(0 + 0.25) * 10 * m1Duration, 0, (0.75 + 0.25) * 10 * m1Duration, 0.75],
      boundType: LineBound.BoundStart,
      scale: PriceScales.regular,
      style: { lineWidth: 2, fill: 1, color: '#00AA00' },
    } as Line,
    locked: false,
    visible: true,
    shareWith: '*' as '*',
  },

  greenLineBoundEnd: {
    id: 'line4',
    title: 'line4',
    type: 'Line',
    data: {
      def: [(0 + 0.5) * 10 * m1Duration, 0, (0.75 + 0.5) * 10 * m1Duration, 0.75],
      boundType: LineBound.BoundEnd,
      scale: PriceScales.regular,
      style: { lineWidth: 2, fill: 1, color: '#00AA00' },
    } as Line,
    locked: false,
    visible: true,
    shareWith: '*' as '*',
  },

  green025VLineNotShared: {
    id: 'vline1',
    title: 'vline1',
    type: 'VLine',
    data: { def: -0.25 * 10 * m1Duration, style: { lineWidth: 2, fill: 1, color: '#00AA00' } },
    locked: false,
    visible: true,
  },

  green025HLineNotShared: {
    id: 'hline1',
    title: 'hline1',
    type: 'HLine',
    data: { def: -0.25, style: { lineWidth: 2, fill: 1, color: '#00AA00' } },
    locked: false,
    visible: true,
  },

  red010VLineShared: {
    id: 'vline2',
    title: 'vline2',
    type: 'VLine',
    data: { def: -0.1 * 10 * m1Duration, style: { lineWidth: 2, fill: 1, color: '#AA0000' } },
    shareWith: '*' as '*',
    locked: false,
    visible: true,
  },

  red010HLineShared: {
    id: 'hline2',
    title: 'hline2',
    type: 'HLine',
    data: { def: -0.1, style: { lineWidth: 2, fill: 1, color: '#AA0000' } },
    shareWith: '*' as '*',
    locked: false,
    visible: true,
  },
};

const valuesCount = 1000;
const timePeriod = m1Duration;
const firstBarTime = Math.floor((Date.now() - valuesCount * timePeriod) / timePeriod) * timePeriod;

const fabric: ContentProviderFabric<OHLCvContentOptions, OHLCv> = (ck: string, co: OHLCvContentOptions, callback: (ck: string, c: OHLCv) => void) => {
  const content: OHLCv = markRaw({
    available: {
      from: firstBarTime as UTCTimestamp,
      to: firstBarTime + (valuesCount - 1) * timePeriod as UTCTimestamp,
    },
    loaded: {
      from: firstBarTime as UTCTimestamp,
      to: firstBarTime + (valuesCount - 1) * timePeriod as UTCTimestamp,
    },
    step: TimePeriods.h1,
    values: new Array<[Price, Price, Price, Price, number]>(valuesCount),
  });

  let contentOptions = co;
  function getOHLCvRecord(prev: OHLCvRecord | undefined): OHLCvRecord {
    const prevValue = prev ? prev[OHLCV_RECORD_CLOSE] : Math.random() * 2 - 1;
    const sign = Math.sign((Math.random() - 0.5));
    const o = prevValue as Price;
    const c = o + sign * Math.random() * 4 as Price;
    const t1 = o + sign * (c - o) * Math.random() * 0.5;
    const t2 = c + sign * (c - o) * Math.random() * 0.5;
    const t3 = o - sign * (c - o) * Math.random() * 0.5;
    const t4 = c - sign * (c - o) * Math.random() * 0.5;
    const v = Math.random() * 1000 + 10;

    return [o, Math.max(t1, t2, t3, t4) as Price, Math.min(t1, t2, t3, t4) as Price, c, v];
  }

  const contentValues = content.values;
  for (let i = 0; i < valuesCount; ++i) {
    contentValues[i] = getOHLCvRecord(i === 0 ? undefined : contentValues[i - 1]);
  }

  const process = () => {
    const contentTp = TIME_PERIODS_MAP.get(content.step);
    if (!contentTp) {
      throw new Error('Oops');
    }
    // add new
    content.available.to = (content.available.to + contentTp.getBarDuration(content.available.to)) as UTCTimestamp;
    content.loaded.to = (content.loaded.to + contentTp.getBarDuration(content.loaded.to)) as UTCTimestamp;
    contentValues.push(getOHLCvRecord(contentValues[contentValues.length - 1]));

    // update last
    // values.splice(-1, 1, [lastBar[OHLCV_RECORD_OPEN], h, l, c, lastBar[OHLCV_RECORD_VOLUME]] as OHLCvRecord);

    // replace all
    // values.splice(0, values.length, newItems);

    callback(ck, content);
  };

  const intervalId = setInterval(process, 1000);

  return {
    options: contentOptions,
    content,
    stop: () => {
      clearInterval(intervalId);
    },
    updateContentOptions: (newContentOptions: OHLCvContentOptions) => {
      console.log(newContentOptions);
      contentOptions = newContentOptions;
    },
  };
};

const binding = new DataBinding(chartApi, new OHLCvPipe(fabric));

mainDs.addChangeEventListener((e) => {
  const events = e.get(DataSourceChangeEventReason.DataInvalid) || [];
  for (const event of events) {
    console.log(event);
  }
});

chartApi.createPane(mainDs, {});

mainDs.addChangeEventListener((events: DataSourceChangeEventsMap) => {
  for (const [reason, reasonEvents] of events) {
    for (const dataSourceChangeEvent of reasonEvents) {
      if (isProxy(dataSourceChangeEvent.entry.descriptor.options)) {
        console.warn(reason, dataSourceChangeEvent);
      }
    }
  }
});

let i = 0;

setTimeout((j: number) => {
  console.log(`${j}) chartApi.clearHistory();`);
  chartApi.clearHistory();
}, 100 * i++, i);

setTimeout((j: number) => {
  console.log(`${j}) chartApi.createPane(~second);`);
  const dataSource: DataSource = new DataSource({ id: 'second', idHelper });
  chartApi.createPane(dataSource, { preferredSize: 0.3 });
}, 100 * i++, i);

// setTimeout((j: number) => {
//   console.log(`${j}) chartApi.undo();`);
//   chartApi.undo();
// }, 100 * i++, i);

// setTimeout((j: number) => {
//   console.log(`${j}) chartApi.undo();`);
//   chartApi.undo();
// }, 100 * i++, i);

// setTimeout((j: number) => {
//   console.log(`${j}) chartApi.redo();`);
//   chartApi.redo();
// }, 100 * i++, i);

// setTimeout((j: number) => {
//   console.log(`${j}) mainDs.add(drawings.green025HLineNotShared);`);

//   mainDs.beginTransaction();
//   mainDs.add(drawings.green025HLineNotShared);
//   mainDs.endTransaction();
// }, 100 * i++, i);

// setTimeout((j: number) => {
//   console.log(`${j}) mainDs.add(drawings.green025VLineNotShared);`);

//   mainDs.beginTransaction();
//   mainDs.add(drawings.green025VLineNotShared);
//   mainDs.endTransaction();
// }, 100 * i++, i);

// setTimeout((j: number) => {
//   console.log(`${j}) mainDs.add(drawings.red010VLineShared);`);

//   mainDs.beginTransaction();
//   mainDs.add(drawings.red010VLineShared);
//   mainDs.endTransaction();
// }, 100 * i++, i);

// setTimeout((j: number) => {
//   console.log(`${j}) mainDs.add(drawings.red010HLineShared);`);

//   mainDs.beginTransaction();
//   mainDs.add(drawings.red010HLineShared);
//   mainDs.endTransaction();
// }, 100 * i++, i);

// setTimeout((j: number) => {
//   console.log(`${j}) mainDs.remove(drawings.red010HLineShared.id);`);

//   mainDs.beginTransaction();
//   mainDs.remove(drawings.red010HLineShared.id);
//   mainDs.endTransaction();
// }, 100 * i++, i);

// setTimeout((j: number) => {
//   console.log(`${j}) mainDs.add(drawings.greenLineBoundBoth);`);

//   mainDs.beginTransaction();
//   mainDs.add(drawings.greenLineBoundBoth);
//   mainDs.endTransaction();
// }, 100 * i++, i);

// setTimeout((j: number) => {
//   console.log(`${j}) mainDs.add(drawings.green0to1LineBoundStart);`);
//
//   mainDs.beginTransaction();
//   mainDs.add(drawings.greenLineBoundStart);
//   mainDs.endTransaction();
// }, 100 * i++, i);
//
// setTimeout((j: number) => {
//   console.log(`${j}) mainDs.add(drawings.green0to1LineBoundEnd);`);
//
//   mainDs.beginTransaction();
//   mainDs.add(drawings.greenLineBoundEnd);
//   mainDs.endTransaction();
// }, 100 * i++, i);
//
// setTimeout((j: number) => {
//   console.log(`${j}) mainDs.add(drawings.green025to075Line);`);
//
//   mainDs.beginTransaction();
//   mainDs.add(drawings.redLineNoBound);
//   mainDs.endTransaction();
// }, 100 * i++, i);

setTimeout((j: number) => {
  console.log(`${j}) mainDs.add(drawings.ohlcvBTCUSDT);`);

  mainDs.beginTransaction();
  mainDs.add(drawings.volumeBTCUSDT);
  mainDs.add(drawings.ohlcvBTCUSDT);
  mainDs.endTransaction();

  chartApi.paneModel('main').timeAxis.primaryEntryRef = { ds: mainDs, entryRef: drawings.ohlcvBTCUSDT.id };
  chartApi.paneModel('main').priceAxis.primaryEntryRef = { ds: mainDs, entryRef: drawings.ohlcvBTCUSDT.id };
  chartApi.paneModel('main').timeAxis.controlMode = ControlMode.AUTO;
  chartApi.paneModel('main').priceAxis.controlMode = ControlMode.AUTO;

  // chartApi.timeAxis.noHistoryManagedUpdate({ range: {
  //   from: firstBarTime as UTCTimestamp,
  //   to: firstBarTime + (300) * timePeriod as UTCTimestamp,
  // } });
}, 100 * i++, i);

i += 50;

setTimeout((j: number) => {
  console.log(`${j}) mainDs.add(drawings.ohlcvBTCUSDT);`);

  console.log(`timeAxis.controlMode from ${chartApi.paneModel('main').timeAxis.controlMode.value} to AUTO`);
  chartApi.paneModel('main').timeAxis.controlMode = ControlMode.AUTO;
  chartApi.paneModel('second').priceAxis.primaryEntryRef = { ds: chartApi.paneModel('second').dataSource, entryRef: ['main', 'ohlcv1'] };
  // chartApi.paneModel('main').priceAxis.controlMode = ControlMode.AUTO;
}, 100 * i++, i);

// i += 50;
//
// setTimeout((j: number) => {
//   console.log(`${j}) chartApi.togglePane(mainDs.id);`);
//   chartApi.togglePane(mainDs.id);
// }, 100 * i++, i);
//
// i += 50;
//
// setTimeout((j: number) => {
//   console.log(`${j}) chartApi.togglePane(mainDs.id);`);
//   chartApi.togglePane(mainDs.id);
// }, 100 * i++, i);

// ---------------------------------------------------------------------------------------------
// setTimeout(() => {
//   chartApi.updateStyle({ text: { fontSize: 20, fontStyle: 'italic' } });
// }, 1000);

</script>

<style lang="scss">
* {
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body, dir, h1, h2, h3, h4, h5, h6, html, li, menu, ol, p, ul {
  margin: 0;
  padding: 0;
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: Trebuchet MS, roboto, ubuntu, sans-serif;
  font-size: 14px;
}

/* app styles */
.wrapper {
  height: 100%;
  width: 100%;
}
</style>
