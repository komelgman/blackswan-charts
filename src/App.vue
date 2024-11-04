<template>
  <chart-widget :chart="chartApi"/>
</template>

<script lang="ts" setup>
import { isProxy } from 'vue';
import ChartWidget from '@/components/chart/ChartWidget.vue';
import { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';
import { Chart } from '@/model/chart/Chart';
import type { Sketcher } from '@/model/chart/viewport/sketchers';
import DataSource from '@/model/datasource/DataSource';
import { DataSourceChangeEventReason, type DataSourceChangeEventsMap } from '@/model/datasource/events';
import type { DrawingOptions, DrawingType } from '@/model/datasource/types';
import IdHelper from '@/model/tools/IdHelper';
import type { Line, OHLCv, OHLCvContentOptions, OHLCvRecord, Price, UTCTimestamp } from '@/model/chart/types';
import {
  LineBound,
  OHLCV_RECORD_CLOSE,
  OHLCV_RECORD_HIGH,
  OHLCV_RECORD_LOW,
  OHLCV_RECORD_OPEN,
  OHLCV_RECORD_VOLUME,
  TimePeriod,
} from '@/model/chart/types';
import type { CandlestickPlot, ColumnsVolumeIndicator } from '@/model/chart/viewport/sketchers/renderers';
import { DataBinding, type ContentProviderFabric } from '@/model/databinding';
import { OHLCvPipe } from '@/model/databinding/pipes/OHLCvPipe';

/**
 * todo
 * ?need check, that is actually needed!
 * Separate line bounds and line definition, snap definition to high timeframe, to eliminate rounding issues
 *
 * Time axis marks
 * Price axis marks
 * Moving lines in scale that's different to line scale (mouse point should keep on line)
 */

const idHelper: IdHelper = new IdHelper();
const mainDs = new DataSource({ id: 'main', idHelper });
const chartApi = new Chart({
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
        step: TimePeriod.m5,
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
        step: TimePeriod.m5,
      },
      plotOptions: {
        type: 'VolumeIndicator',
        style: {
          type: 'Columns',
          bearish: {
            body: '#EF5350',
            border: '#EF5350',
          },
          bullish: {
            body: '#26A29A',
            border: '#26A29A',
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
      def: [-1 * 10 * TimePeriod.m1, -0.25, 1 * 10 * TimePeriod.m1, 0.75],
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
      def: [0, 0.75, 0.75 * 10 * TimePeriod.m1, 0.75],
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
      def: [(0 + 0.25) * 10 * TimePeriod.m1, 0, (0.75 + 0.25) * 10 * TimePeriod.m1, 0.75],
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
      def: [(0 + 0.5) * 10 * TimePeriod.m1, 0, (0.75 + 0.5) * 10 * TimePeriod.m1, 0.75],
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
    data: { def: -0.25 * 10 * TimePeriod.m1, style: { lineWidth: 2, fill: 1, color: '#00AA00' } },
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
    data: { def: -0.1 * 10 * TimePeriod.m1, style: { lineWidth: 2, fill: 1, color: '#AA0000' } },
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

const fabric: ContentProviderFabric<OHLCvContentOptions, OHLCv> = (ck: string, co: OHLCvContentOptions, callback: (ck: string, c: OHLCv) => void) => {
  const content: OHLCv = {
    available: { from: 0 as UTCTimestamp, to: 10 * TimePeriod.m1 as UTCTimestamp },
    loaded: { from: 0 as UTCTimestamp, to: 10 * TimePeriod.m1 as UTCTimestamp },
    step: TimePeriod.m1,
    values: [
      [0.3, 0.5, 0.1, 0.15, 1000],
      [0.15, 0.6, 0.0, 0.45, 1500],
      [0.35, 0.7, 0.3, 0.55, 300],
    ] as [Price, Price, Price, Price, number][],
  };

  let contentOptions = co;

  const process = () => {
    const values = content?.values || [];
    const lastBar = values[values.length - 1];
    const c = (lastBar[OHLCV_RECORD_CLOSE] + Math.random() * lastBar[OHLCV_RECORD_CLOSE] * 0.2 - lastBar[OHLCV_RECORD_CLOSE] * 0.1) as Price;
    const h = Math.max(lastBar[OHLCV_RECORD_HIGH], c) as Price;
    const l = Math.min(lastBar[OHLCV_RECORD_LOW], c) as Price;

    // add new
    // values.push(lastBar);

    // update last
    values.splice(-1, 1, [lastBar[OHLCV_RECORD_OPEN], h, l, c, lastBar[OHLCV_RECORD_VOLUME]] as OHLCvRecord);

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

setTimeout((j: number) => {
  console.log(`${j}) chartApi.undo();`);
  chartApi.undo();
}, 100 * i++, i);

setTimeout((j: number) => {
  console.log(`${j}) chartApi.undo();`);
  chartApi.undo();
}, 100 * i++, i);

setTimeout((j: number) => {
  console.log(`${j}) chartApi.redo();`);
  chartApi.redo();
}, 100 * i++, i);

setTimeout((j: number) => {
  console.log(`${j}) mainDs.add(drawings.green025HLineNotShared);`);

  mainDs.beginTransaction();
  mainDs.add(drawings.green025HLineNotShared);
  mainDs.endTransaction();
}, 100 * i++, i);

setTimeout((j: number) => {
  console.log(`${j}) mainDs.add(drawings.green025VLineNotShared);`);

  mainDs.beginTransaction();
  mainDs.add(drawings.green025VLineNotShared);
  mainDs.endTransaction();
}, 100 * i++, i);

setTimeout((j: number) => {
  console.log(`${j}) mainDs.add(drawings.red010VLineShared);`);

  mainDs.beginTransaction();
  mainDs.add(drawings.red010VLineShared);
  mainDs.endTransaction();
}, 100 * i++, i);

setTimeout((j: number) => {
  console.log(`${j}) mainDs.add(drawings.red010HLineShared);`);

  mainDs.beginTransaction();
  mainDs.add(drawings.red010HLineShared);
  mainDs.endTransaction();
}, 100 * i++, i);

setTimeout((j: number) => {
  console.log(`${j}) mainDs.remove(drawings.red010HLineShared.id);`);

  mainDs.beginTransaction();
  mainDs.remove(drawings.red010HLineShared.id);
  mainDs.endTransaction();
}, 100 * i++, i);

setTimeout((j: number) => {
  console.log(`${j}) mainDs.add(drawings.greenLineBoundBoth);`);

  mainDs.beginTransaction();
  mainDs.add(drawings.greenLineBoundBoth);
  mainDs.endTransaction();
}, 100 * i++, i);

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
  mainDs.add(drawings.ohlcvBTCUSDT);
  mainDs.add(drawings.volumeBTCUSDT);
  mainDs.endTransaction();

  chartApi.timeAxis.noHistoryManagedUpdate({ range: { from: -10 * TimePeriod.m1 as UTCTimestamp, to: 10 * TimePeriod.m1 as UTCTimestamp } });
}, 100 * i++, i);

setTimeout((j: number) => {
  console.log(`${j}) mainDs.reset();`);

  mainDs.reset();
  mainDs.reset();
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
