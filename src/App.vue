<template>
  <chart-widget ref="chart" :chart="chartApi"/>
</template>

<script lang="ts">
import DataProvider from '@/model/datasource/DataProvider';
import { isProxy } from 'vue';
import { Options, Vue } from 'vue-class-component';
import ChartWidget from '@/components/chart/ChartWidget.vue';
import { PriceScales } from '@/model/axis/scaling/PriceAxisScale';
import Chart from '@/model/Chart';
import DataSource from '@/model/datasource/DataSource';
import type { DataSourceChangeEventsMap } from '@/model/datasource/DataSourceChangeEventListener';
import type { DrawingOptions, DrawingType } from '@/model/datasource/Drawing';
import { LineBound } from '@/model/type-defs';
import type { Line, UTCTimestamp, OHLCvChart, Price, CandlestickChartStyle, VolumeIndicator, OHLCv } from '@/model/type-defs';
import type Sketcher from '@/model/sketchers/Sketcher';
import IdHelper from '@/model/tools/IdHelper';

/**
 * todo
 * ?need check, that is actually needed! Separate line bounds and line definition, snap definition to high timeframe, to eliminate rounding issues
 * Time axis marks
 * Price axis marks
 * Moving lines in scale that's different to line scale (mouse point should keep on line)
 */


@Options({
  components: {
    ChartWidget,
  },
})
export default class App extends Vue {
  chartApi!: Chart;
  private idHelper!: IdHelper;
  private mainDs!: DataSource;
  private dataProvider!: DataProvider<OHLCv>;

  created(): void {
    this.idHelper = new IdHelper();
    this.mainDs = new DataSource({ id: 'main', idHelper: this.idHelper }, []);

    this.dataProvider = new DataProvider('ohlcvBTCUSDT', 'DataProvider_OHLCv', {
      from: 0 as UTCTimestamp,
      step: 0.01 as UTCTimestamp,
      values: [
        [0.3, 0.5, 0.1, 0.15, 1000],
        [0.15, 0.6, 0.0, 0.45, 1500],
        [0.35, 0.7, 0.3, 0.55, 300]
      ] as [Price, Price, Price, Price, number][]
    });

    this.mainDs.registerDataProvider(this.dataProvider);

    this.chartApi = new Chart({ sketchers: new Map<DrawingType, Sketcher>([]), style: {} });
    this.chartApi.createPane(this.mainDs, {});
    this.chartApi.clearHistory();
  }

  mounted(): void {
    const { chartApi, mainDs } = this;

    const drawings = {
      ohlcvBTCUSDT: {
        id: 'ohlcv1',
        title: 'BTCUSDT',
        type: 'OHLCv',
        data: {
          dataProvider: 'ohlcvBTCUSDT',
          subtype: 'Candlestick',
          style: {
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
            }
          } as CandlestickChartStyle,
        },
        locked: false,
        visible: true,
        shareWith: '*' as '*',
      } as DrawingOptions<OHLCvChart>,

      volumeBTCUSDT: {
        id: 'volume1',
        title: 'BTCUSDT Volume',
        type: 'Volume',
        data: {
          dataProvider: 'ohlcvBTCUSDT',
          subtype: 'Columns',
          style: {
            bearish: '#EF5350',
            bullish: '#26A29A',
          }
        },
        locked: false,
        visible: true,
      } as DrawingOptions<VolumeIndicator>,

      redLineNoBound: {
        id: 'line1',
        title: 'line1',
        type: 'Line',
        data: {
          def: [-1, -0.25, 1, 0.75],
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
          def: [-0.25, -0.25, 0.75, 0.75],
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
          def: [0 + 0.25, 0, 0.75 + 0.25, 0.75],
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
          def: [0 + 0.5, 0, 0.75 + 0.5, 0.75],
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
        data: { def: -0.25, style: { lineWidth: 2, fill: 1, color: '#00AA00' } },
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
        data: { def: -0.1, style: { lineWidth: 2, fill: 1, color: '#AA0000' } },
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

    mainDs.addChangeEventListener((events: DataSourceChangeEventsMap) => {
      for (const [reason, reasonEvents] of events) {
        for (const dataSourceChangeEvent of reasonEvents) {
          if (isProxy(dataSourceChangeEvent.entry.descriptor.options)) {
            console.trace(reason, dataSourceChangeEvent);
          }
        }
      }
    });

    // sample 1
    let i = 0;

    setTimeout((j: number) => {
      console.log(`${j}) chartApi.clearHistory();`);
      chartApi.clearHistory();
    }, 100 * i++, i);

    setTimeout((j: number) => {
      console.log(`${j}) chartApi.createPane(~second);`);
      const dataSource: DataSource = new DataSource({ id: 'second', idHelper: this.idHelper }, []);
      dataSource.registerDataProvider(this.dataProvider);
      chartApi.createPane(dataSource, { preferredSize: 0.3 });
    }, 100 * i++, i);

    // setTimeout((j: number) => {
    //   console.log(`${j}) chartApi.undo();`);
    //   chartApi.undo();
    // }, 100 * i++, i);
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) chartApi.undo();`);
    //   chartApi.undo();
    // }, 100 * i++, i);
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) chartApi.redo();`);
    //   chartApi.redo();
    // }, 100 * i++, i);
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) this.mainDs.add(drawings.green025HLineNotShared);`);
    //
    //   this.mainDs.beginTransaction();
    //   this.mainDs.add(drawings.green025HLineNotShared);
    //   this.mainDs.endTransaction();
    // }, 100 * i++, i);
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) this.mainDs.add(drawings.green025VLineNotShared);`);
    //
    //   this.mainDs.beginTransaction();
    //   this.mainDs.add(drawings.green025VLineNotShared);
    //   this.mainDs.endTransaction();
    // }, 100 * i++, i);
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) this.mainDs.add(drawings.red010VLineShared);`);
    //
    //   this.mainDs.beginTransaction();
    //   this.mainDs.add(drawings.red010VLineShared);
    //   this.mainDs.endTransaction();
    // }, 100 * i++, i);
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) this.mainDs.add(drawings.red010HLineShared);`);
    //
    //   this.mainDs.beginTransaction();
    //   this.mainDs.add(drawings.red010HLineShared);
    //   this.mainDs.endTransaction();
    // }, 100 * i++, i);
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) this.mainDs.remove(drawings.red010HLineShared.id);`);
    //
    //   this.mainDs.beginTransaction();
    //   this.mainDs.remove(drawings.red010HLineShared.id);
    //   this.mainDs.endTransaction();
    // }, 100 * i++, i);
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) this.mainDs.add(drawings.green0to1LineBoundBoth);`);
    //
    //   this.mainDs.beginTransaction();
    //   this.mainDs.add(drawings.greenLineBoundBoth);
    //   this.mainDs.endTransaction();
    // }, 100 * i++, i);
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) this.mainDs.add(drawings.green0to1LineBoundStart);`);
    //
    //   this.mainDs.beginTransaction();
    //   this.mainDs.add(drawings.greenLineBoundStart);
    //   this.mainDs.endTransaction();
    // }, 100 * i++, i);
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) this.mainDs.add(drawings.green0to1LineBoundEnd);`);
    //
    //   this.mainDs.beginTransaction();
    //   this.mainDs.add(drawings.greenLineBoundEnd);
    //   this.mainDs.endTransaction();
    // }, 100 * i++, i);
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) this.mainDs.add(drawings.green025to075Line);`);
    //
    //   this.mainDs.beginTransaction();
    //   this.mainDs.add(drawings.redLineNoBound);
    //   this.mainDs.endTransaction();
    // }, 100 * i++, i);

    setTimeout((j: number) => {
      console.log(`${j}) this.mainDs.add(drawings.hlocBTCUSDT);`);

      this.mainDs.beginTransaction();
      this.mainDs.add(drawings.ohlcvBTCUSDT);
      this.mainDs.add(drawings.volumeBTCUSDT);
      this.mainDs.endTransaction();
    }, 100 * i++, i);

    setTimeout((j: number) => {
      console.log(`${j}) this.mainDs.process('hlocv1', ...);`);

      const process = () => {
        const values = this.dataProvider.data.values;
        const lastBar = values[values.length - 1];
        const c = lastBar[3] + Math.random() * lastBar[3] * 0.2 - lastBar[3] * 0.1;
        const h = Math.max(lastBar[1], c);
        const l = Math.min(lastBar[2], c);

        // add new
        // values.push(lastBar);

        // update last
        values.splice(-1, 1, [lastBar[0], h, l, c, lastBar[4]] as [Price, Price, Price, Price, number]);

        // replace all
        // values.splice(0, values.length, newItems);
      };

      setInterval(process, 500);
    }, 100 * i++, i);

    // watch([chartApi.timeAxis.range, chartApi.timeAxis.requestedDataRange], (range) => {
    //   console.log(JSON.stringify(range));
    // });
    //
    // setTimeout((j: number) => {
    //   console.log(`${j}) chartApi.paneModel('main').timeAxis.requestDataRange("xxx", {from: -1, to: 0 });`);
    //   // warn !!! it's low level access, TVA not used
    //   chartApi.paneModel('main').timeAxis.requestDataRange("xxx1", {from: -1, to: 0 });
    // }, 100 * i++, i);


    // ---------------------------------------------------------------------------------------------
    // setTimeout(() => {
    //   chartApi.updateStyle({ text: { fontSize: 20, fontStyle: 'italic' } });
    // }, 1000);
  }
}
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
