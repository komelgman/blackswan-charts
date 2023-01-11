<template>
  <chart-widget ref="chart" :chart="chartApi"/>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import IdHelper from '@/model/tools/IdHelper';
import ChartWidget from '@/components/chart/ChartWidget.vue';
import DataSource from '@/model/datasource/DataSource';
import Chart from '@/model/Chart';
import type { DrawingType } from '@/model/datasource/Drawing';
import type Sketcher from '@/model/sketchers/Sketcher';

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
    this.mainDs = new DataSource({ id: 'main', idHelper: this.idHelper }, [
      // {
      //   id: 'hline1',
      //   title: 'hline1',
      //   type: 'HLine',
      //   data: { def: -0.5, style: { lineWidth: 1, fill: 0, color: '#AA0000' } },
      //   locked: true,
      //   visible: true,
      // },
      {
        id: 'hline2',
        title: 'hline2',
        type: 'HLine',
        data: { def: -0.25, style: { lineWidth: 2, fill: 1, color: '#00AA00' } },
        locked: false,
        visible: true,
      },
      // {
      //   id: 'hline3',
      //   title: 'hline3',
      //   type: 'HLine',
      //   data: { def: 0, style: { lineWidth: 3, fill: 2, color: '#0000BB' } },
      //   locked: false,
      //   visible: true,
      // },
      {
        id: 'hline4',
        title: 'hline4',
        type: 'HLine',
        data: { def: 0.25, style: { lineWidth: 4, fill: 3, color: '#AA00BB' } },
        locked: false,
        visible: true,
      },
      // {
      //   id: 'hline5',
      //   title: 'hline5',
      //   type: 'HLine',
      //   data: { def: 0.5, style: { lineWidth: 5, fill: 4, color: '#AA00BB' } },
      //   locked: false,
      //   visible: true,
      // },
      {
        id: 'vline1',
        title: 'vline1',
        type: 'VLine',
        data: { def: 0, style: { lineWidth: 3, fill: 2, color: '#AABBCC' } },
        locked: false,
        visible: true,
        shareWith: '*',
      },
    ]);
    this.chartApi = new Chart({ sketchers: new Map<DrawingType, Sketcher>([]), style: {} });
  }

  mounted(): void {
    const { chartApi } = this;
    chartApi.createPane(this.mainDs, { size: 150 });
    chartApi.clearHistory();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const secondPane = chartApi.createPane(new DataSource({ idHelper: this.idHelper }, [
      {
        id: 'hline1',
        title: 'hline1',
        type: 'HLine',
        data: { def: 0.5, style: { lineWidth: 4, fill: 0, color: '#AA0000' } },
        locked: false,
        visible: true,
        shareWith: ['main'],
      },
    ]), { size: 150 });

    // ---------------------------------------------------------------------------------------------
    // chartApi.clearHistory();
    //
    // setTimeout(() => {
    //   const thirdPane = chartApi.createPane(new DataSource([
    //     {
    //       id: 'hline1',
    //       title: 'hline1',
    //       type: 'HLine',
    //       data: { def: 0.2, style: { lineWidth: 1, fill: 2, color: '#00AA00' } },
    //       locked: false,
    //       visible: true,
    //       shared: true,
    //     },
    //   ]), { size: 150 });
    // }, 1000)

    // ---------------------------------------------------------------------------------------------
    // const newId: DrawingId = this.mainDs.getNewId('HLine');
    // this.mainDs.beginTransaction();
    // this.mainDs.add({
    //   id: newId,
    //   title: 'test hline',
    //   type: 'HLine',
    //   data: { def: 0, style: { lineWidth: 1, fill: 0, color: '#00AA00' } },
    //   locked: false,
    //   visible: true,
    // });
    // this.mainDs.endTransaction();
    //
    // this.mainDs.beginTransaction();
    // this.mainDs.remove(newId);
    // this.mainDs.endTransaction();

    // ---------------------------------------------------------------------------------------------
    // setTimeout(() => {
    //   chartApi.togglePane(secondPane);
    //
    //   setTimeout(() => {
    //     chartApi.togglePane(secondPane);
    //   }, 1000);
    // }, 1000);

    // ---------------------------------------------------------------------------------------------
    // chartApi.removePane('mainPane');

    // ---------------------------------------------------------------------------------------------
    // chartApi.swapPanes('mainPane', secondPane);

    // ---------------------------------------------------------------------------------------------
    setTimeout(() => {
      chartApi.updateStyle({ text: { fontSize: 20, fontStyle: 'italic' } });
    }, 1000);

    // chartApi.updateStyle({ text: { fontSize: 14, fontStyle: 'italic' } });
    // chartApi.updateStyle({ text: { fontSize: 13, fontStyle: 'italic' } });

    //* sample 0
    setTimeout(() => {
      // Object.assign(chartApi.paneModel('mainPane').priceAxis.range, {
      //   from: -2000000 as Price,
      //   to: 500 as Price,
      // });
      //
      // Object.assign(chartApi.paneModel(secondPane).priceAxis.range, {
      //   from: 200 as Price,
      //   to: 5000 as Price,
      // });
      //
      // Object.assign(chartApi.paneModel(thirdPane).priceAxis.range, {
      //   from: 300 as Price,
      //   to: 50000 as Price,
      // });

      // chartApi.paneModel(thirdPane).priceAxis.marks.push({
      //   value: 2500 as Price,
      //   lineStyle: {
      //     fill: LineFillStyle.LargeDashed,
      //     color: '#00FFFF',
      //     lineWidth: 1,
      //   },
      // });
      //
      // chartApi.paneModel(thirdPane).priceAxis.marks.push({
      //   value: 100 as Price,
      //   lineStyle: {
      //     fill: LineFillStyle.LargeDashed,
      //     color: '#00FF00',
      //     lineWidth: 1,
      //   },
      // });
    }, 3000);

    //* sample 1
    // setTimeout(() => {
    //   // mainDs.processEntry(0, (entry) => ({ ...entry, visible: false }));
    //   this.mainDs.processEntry(0, (entry: DataSourceEntry<number[][]>) => {
    //     // eslint-disable-next-line
    //     entry.visible = false;
    //
    //     // add
    //     entry.data.push([1, 2, 3], [4, 5, 6]);
    //   });
    // }, 5000);

    //* sample 2
    // setTimeout(() => {
    //   this.chart.updateOptions({ text: { fontSize: 20, fontStyle: 'italic' } });
    // }, 3000);

    //* sample 3
    // setTimeout(() => {
    //   this.chart.swapPanes(0, 2);
    // }, 3000);

    //* sample 4
    // setTimeout(() => {
    //   // this.chart.removePane(1);
    //   this.chart.hidePane(this.chart.panes[1].id);
    // }, 5000);

    //* sample 5
    // setTimeout(() => {
    //   this.mainDs.setVisible(false, [1]);
    //   this.mainDs.remove(new Set([2]));
    // }, 5000);

    //* sample 6
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

    //* sample 7
    // setTimeout(() => {
    //   this.chart.panes[1].model.priceAxis.inverted.value = 1;
    // }, 2000);

    //* sample 8
    // setTimeout(() => {
    //   this.chartModel.timeAxis.range = { from: 2 as UTCTimestamp, to: 6 as UTCTimestamp };
    // }, 5000);

    //* sample 9
    // setTimeout(() => {
    //   mainDs.bringToFront(0);
    //   console.log('mainDs.entries', mainDs.entries);
    // }, 8000);

    //* sample 10
    // setTimeout(() => {
    //   console.log('this.chartModel.panes[0].model.timeAxis.scale = 3;');
    //   this.chartModel.panes[0].model.timeAxis.scale = 3;
    //
    //   console.log('this.chartModel.panes[0].model.priceAxis.scale = 3;');
    //   this.chartModel.panes[0].model.priceAxis.scale = 3;
    // }, 10000);
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
