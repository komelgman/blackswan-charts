<template>
  <chart-widget ref="chart" :chart="chartApi"/>
</template>

<script lang="ts">
import { isProxy } from 'vue';
import { Options, Vue } from 'vue-class-component';
import ChartWidget from '@/components/chart/ChartWidget.vue';
import { PriceScales } from '@/model/axis/scaling/PriceAxisScale';
import Chart from '@/model/Chart';
import DataSource from '@/model/datasource/DataSource';
import type { DataSourceChangeEventsMap } from '@/model/datasource/DataSourceChangeEventListener';
import type { DrawingType } from '@/model/datasource/Drawing';
import { LineBound } from '@/model/type-defs';
import type { Line } from '@/model/type-defs';
import type Sketcher from '@/model/sketchers/Sketcher';
import IdHelper from '@/model/tools/IdHelper';

@Options({
  components: {
    ChartWidget,
  },
})
export default class App extends Vue {
  chartApi!: Chart;
  private idHelper!: IdHelper;
  private mainDs!: DataSource;

  created(): void {
    this.idHelper = new IdHelper();
    this.mainDs = new DataSource({ id: 'main', idHelper: this.idHelper }, []);

    this.chartApi = new Chart({ sketchers: new Map<DrawingType, Sketcher>([]), style: {} });
    this.chartApi.createPane(this.mainDs, {});
    this.chartApi.clearHistory();
  }

  mounted(): void {
    const { chartApi, mainDs } = this;

    const drawings = {
      green025to075Line: {
        id: 'line1',
        title: 'line1',
        type: 'Line',
        data: {
          def: [0.25, 0, 0.75, 1],
          boundType: LineBound.NoBound,
          scale: PriceScales.regular,
          style: { lineWidth: 2, fill: 1, color: '#00AA00' },
        } as Line,
        locked: false,
        visible: true,
        shareWith: '*' as '*',
      },

      green0to1Line: {
        id: 'line2',
        title: 'line2',
        type: 'Line',
        data: {
          def: [0, 0, 1, 1],
          boundType: LineBound.Both,
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
          if (isProxy(dataSourceChangeEvent.entry[0].options)) {
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
      chartApi.createPane(new DataSource({ id: 'second', idHelper: this.idHelper }, []), { preferredSize: 0.3 });
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
      console.log(`${j}) this.mainDs.add(drawings.green025HLineNotShared);`);

      this.mainDs.beginTransaction();
      this.mainDs.add(drawings.green025HLineNotShared);
      this.mainDs.endTransaction();
    }, 100 * i++, i);

    setTimeout((j: number) => {
      console.log(`${j}) this.mainDs.add(drawings.green025VLineNotShared);`);

      this.mainDs.beginTransaction();
      this.mainDs.add(drawings.green025VLineNotShared);
      this.mainDs.endTransaction();
    }, 100 * i++, i);

    setTimeout((j: number) => {
      console.log(`${j}) this.mainDs.add(drawings.red010VLineShared);`);

      this.mainDs.beginTransaction();
      this.mainDs.add(drawings.red010VLineShared);
      this.mainDs.endTransaction();
    }, 100 * i++, i);

    setTimeout((j: number) => {
      console.log(`${j}) this.mainDs.add(drawings.red010HLineShared);`);

      this.mainDs.beginTransaction();
      this.mainDs.add(drawings.red010HLineShared);
      this.mainDs.endTransaction();
    }, 100 * i++, i);

    setTimeout((j: number) => {
      console.log(`${j}) this.mainDs.remove(drawings.red010HLineShared.id);`);

      this.mainDs.beginTransaction();
      this.mainDs.remove(drawings.red010HLineShared.id);
      this.mainDs.endTransaction();
    }, 100 * i++, i);

    setTimeout((j: number) => {
      console.log(`${j}) this.mainDs.add(drawings.green0to1Line);`);

      this.mainDs.beginTransaction();
      this.mainDs.add(drawings.green0to1Line);
      this.mainDs.endTransaction();
    }, 100 * i++, i);

    // setTimeout((j: number) => {
    //   console.log(`${j}) chartApi.paneModel('main').priceAxis.update({ inverted: true });`);
    //   // warn !!! it's low level access, TVA not used
    //   chartApi.paneModel('main').priceAxis.update({ inverted: true });
    // }, 100 * i++, i);

    // ---------------------------------------------------------------------------------------------
    // setTimeout(() => {
    //   chartApi.togglePane(secondPane);
    //
    //   setTimeout(() => {
    //     chartApi.togglePane(secondPane);
    //   }, 1000);
    // }, 1000);

    // ---------------------------------------------------------------------------------------------
    // chartApi.swapPanes('mainPane', secondPane);

    // ---------------------------------------------------------------------------------------------
    // chartApi.removePane('mainPane');

    // ---------------------------------------------------------------------------------------------
    // setTimeout(() => {
    //   chartApi.updateStyle({ text: { fontSize: 20, fontStyle: 'italic' } });
    // }, 1000);

    // todo add entry processing, no tva, used for system changes (like current tick changes)
    // setTimeout(() => {
    //   this.mainDs.processEntry(0, (entry: DataSourceEntry<number[][]>) => {
    //     // eslint-disable-next-line
    //     entry.visible = false;
    //
    //     // add
    //     entry.data.push([1, 2, 3], [4, 5, 6]);
    //   });
    // }, 5000);

    // setTimeout(() => {
    //   this.mainDs.processEntry(1, (entry: DataSourceEntry<number[][]>) => {
    //     // replace
    //     entry.data.splice(0, entry.data.length, [1, 2, 3], [4, 5, 6]);
    //   });
    //   this.mainDs.processEntry(2, (entry: DataSourceEntry<number[][]>) => {
    //     // update last
    //     entry.data.splice(-1, 1, [7, 8, 9]);
    //   });
    // }, 5000);

    // setTimeout(() => {
    //   this.chartModel.timeAxis.range = { from: 2 as UTCTimestamp, to: 6 as UTCTimestamp };
    // }, 5000);
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
