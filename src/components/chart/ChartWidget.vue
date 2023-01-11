<template>
  <box-layout
    direction="vertical"
    :style="cssVars"
    @keydown="onKeyDown"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @contextmenu.prevent
    tabindex="0"
  >
    <ContextMenu ref="contextmenu"/>
    <multipane
      :items="chart.panes"
      direction="vertical"
      resizable
      @drag-handle-moved="chart.onPaneSizeChanged.bind(chart)"
    >
      <template v-slot:default="props">
        <box-layout>
          <viewport-widget
            :viewport-model="props.model"
            v-contextmenu="{
              model: getViewportContextMenu(props.model),
              instance: $refs['contextmenu'],
            }"
          />

          <divider/>

          <price-axis-widget
            :viewport-model="props.model"
            v-contextmenu="{
              model: getPriceAxisContextMenu(props.model.priceAxis),
              instance: $refs['contextmenu'],
            }"
          />
        </box-layout>
      </template>
    </multipane>

    <divider/>

    <box-layout :style="timeLineStyle">
      <time-axis-widget
        :time-axis="chart.timeAxis"
        v-contextmenu="{
          model: getTimeAxisContextMenu(),
          instance: $refs['contextmenu'],
        }"
      />

      <divider/>

      <div class="pane" :style="timeLineButtonPaneStyle"/>
    </box-layout>
  </box-layout>
</template>

<script lang="ts">
import type { CSSProperties } from 'vue';
import { Prop, Provide } from 'vue-property-decorator';
import { Options, Vue } from 'vue-class-component';
import type Chart from '@/model/Chart';
import PriceAxisWidget from '@/components/chart/PriceAxisWidget.vue';
import TimeAxisWidget from '@/components/chart/TimeAxisWidget.vue';
import ViewportWidget from '@/components/chart/ViewportWidget.vue';
import ContextMenu from '@/components/context-menu/ContextMenu.vue';
import contextMenuDirective from '@/components/context-menu/ContextMenuDirective';
import type { ContextMenuOptionsProvider } from '@/components/context-menu/ContextMenuOptions';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import { BoxLayout, Divider, Multipane } from '@/components/layout';
import type { PanesSizeChangeEvent } from '@/components/layout/PanesSizeChangedEvent';
import type { DeepPartial } from '@/misc/strict-type-checks';
import type PriceAxis from '@/model/axis/PriceAxis';
import type ChartState from '@/model/ChartState';
import type { ChartStyle } from '@/model/ChartStyle';
import PriceAxisContextMenu from '@/model/context-menu/PriceAxisContextMenu';
import TimeAxisContextMenu from '@/model/context-menu/TimeAxisContextMenu';
import ViewportContextMenu from '@/model/context-menu/ViewportContextMenu';
import type { DrawingType } from '@/model/datasource/Drawing';
import type Sketcher from '@/model/sketchers/Sketcher';
import type Viewport from '@/model/viewport/Viewport';

export declare type ChartOptions = { style: DeepPartial<ChartStyle>, sketchers: Map<DrawingType, Sketcher> };

@Options({
  components: {
    ViewportWidget,
    TimeAxisWidget,
    BoxLayout,
    Multipane,
    PriceAxisWidget,
    Divider,
    LayeredCanvas,
    ContextMenu,
  },
  directives: {
    contextmenu: contextMenuDirective,
  },
})
export default class ChartWidget extends Vue {
  @Prop() chart!: Chart;

  private contextMenuMap: WeakMap<any, ContextMenuOptionsProvider> = new WeakMap<any, ContextMenuOptionsProvider>();

  @Provide({ reactive: true })
  private get chartStyle(): ChartStyle {
    return this.chart.style;
  }

  @Provide({ reactive: true })
  private get chartState(): ChartState {
    return this.chart.state;
  }

  mounted(): void {
    const htmlBodyElement: HTMLBodyElement = document.querySelector('body') as HTMLBodyElement;
    htmlBodyElement.style.backgroundColor = this.chart.style.backgroundColor;
  }

  unmounted(): void {
    (document.querySelector('body') as HTMLBodyElement).style.backgroundColor = '';
  }

  getPriceAxisContextMenu(priceAxis: PriceAxis): ContextMenuOptionsProvider {
    if (!this.contextMenuMap.has(priceAxis)) {
      this.contextMenuMap.set(priceAxis, new PriceAxisContextMenu(priceAxis));
    }

    return this.contextMenuMap.get(priceAxis) as ContextMenuOptionsProvider;
  }

  getTimeAxisContextMenu(): ContextMenuOptionsProvider {
    const { timeAxis } = this.chart;
    if (!this.contextMenuMap.has(timeAxis)) {
      this.contextMenuMap.set(timeAxis, new TimeAxisContextMenu(timeAxis));
    }

    return this.contextMenuMap.get(timeAxis) as ContextMenuOptionsProvider;
  }

  getViewportContextMenu(viewport: Viewport): ContextMenuOptionsProvider {
    if (!this.contextMenuMap.has(viewport)) {
      this.contextMenuMap.set(viewport, new ViewportContextMenu(viewport));
    }

    return this.contextMenuMap.get(viewport) as ContextMenuOptionsProvider;
  }

  onMouseEnter(): void {
    this.$el.focus();
  }

  onMouseLeave(): void {
    this.$el.blur();
  }

  onPaneSizeChanged(e: PanesSizeChangeEvent): void {
    this.chart.onPaneSizeChanged(e);
  }

  onKeyDown(e: KeyboardEvent): void {
    // https://keyjs.dev/
    const isCommandKey: boolean = e.ctrlKey || e.metaKey;
    const isZKeyPressed: boolean = e.code === 'KeyZ';

    if (isZKeyPressed && isCommandKey) {
      e.preventDefault();
      if (e.shiftKey) {
        this.chart.redo();
      } else {
        this.chart.undo();
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get cssVars(): any {
    const {
      backgroundColor,
      borderColor,
      resizeHandleColorOnHover,
      menuBackgroundColor,
      menuBackgroundColorOnHover,
    } = this.chart.style;

    return {
      '--primary-background-color': backgroundColor,
      '--border-color': borderColor,
      '--resize-handle-color-on-hover': resizeHandleColorOnHover,
      '--menu-background-color': menuBackgroundColor,
      '--menu-background-color-on-hover': menuBackgroundColorOnHover,
    };
  }

  get timeLineStyle(): CSSProperties {
    return {
      maxHeight: `${this.chartState.timeWidgetHeight}px`,
      minHeight: `${this.chartState.timeWidgetHeight}px`,
      height: `${this.chartState.timeWidgetHeight}px`,
    };
  }

  get timeLineButtonPaneStyle(): CSSProperties {
    return {
      display: 'flex',
      flex: '1 1 auto',
      maxWidth: `${this.chartState.priceWidgetWidth}px`,
      minWidth: `${this.chartState.priceWidgetWidth}px`,
      width: `${this.chartState.priceWidgetWidth}px`,
    };
  }
}
</script>
