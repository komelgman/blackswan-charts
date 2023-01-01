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
      :items="api.panes"
      direction="vertical"
      resizable
      @drag-handle-moved="api.onPaneSizeChanged.bind(api)"
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
        :time-axis="api.timeAxis"
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
import { reactive } from 'vue';
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
import { clone, merge } from '@/misc/strict-type-checks';
import type PriceAxis from '@/model/axis/PriceAxis';
import ChartAPI from '@/model/ChartAPI';
import type ChartState from '@/model/ChartState';
import type { ChartStyle } from '@/model/ChartStyle';
import chartOptionsDefaults from '@/model/ChartStyle.Defaults';
import PriceAxisContextMenu from '@/model/context-menu/PriceAxisContextMenu';
import TimeAxisContextMenu from '@/model/context-menu/TimeAxisContextMenu';
import ViewportContextMenu from '@/model/context-menu/ViewportContextMenu';
import type { DrawingType } from '@/model/datasource/Drawing';
import type Sketcher from '@/model/sketchers/Sketcher';
import sketcherDefaults from '@/model/sketchers/Sketcher.Defaults';
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
  @Prop()
  private options!: ChartOptions;
  private controller!: ChartAPI;
  @Provide({ reactive: true })
  private chartStyle!: ChartStyle;
  @Provide({ reactive: true })
  private chartState!: ChartState;

  private contextMenuMap: WeakMap<any, ContextMenuOptionsProvider> = new WeakMap<any, ContextMenuOptionsProvider>();

  @Provide({ reactive: true })
  private sketchers!: Map<DrawingType, Sketcher>;

  created(): void {
    this.chartStyle = this.createChartStyleOptions();
    this.sketchers = this.createSketchersOptions();

    this.chartState = reactive({
      priceWidgetWidth: -1,
      timeWidgetHeight: -1,
    });

    this.controller = new ChartAPI(this.chartState, this.chartStyle, this.sketchers);
  }

  mounted(): void {
    const htmlBodyElement: HTMLBodyElement = document.querySelector('body') as HTMLBodyElement;
    htmlBodyElement.style.backgroundColor = this.chartStyle.backgroundColor;
  }

  unmounted(): void {
    (document.querySelector('body') as HTMLBodyElement).style.backgroundColor = '';
  }

  public get api(): ChartAPI {
    return this.controller;
  }

  private createChartStyleOptions(): ChartStyle {
    if (this.options && this.options.style) {
      return merge(clone(chartOptionsDefaults), this.options.style)[0] as ChartStyle;
    }

    return clone(chartOptionsDefaults);
  }

  private createSketchersOptions(): Map<DrawingType, Sketcher> {
    const result: Map<DrawingType, Sketcher> = new Map(sketcherDefaults);

    if (this.options?.sketchers) {
      this.options.sketchers.forEach((value, key) => result.set(key, value));
    }

    result.forEach((value) => value.setChartStyle(this.chartStyle));

    return result;
  }

  getPriceAxisContextMenu(priceAxis: PriceAxis): ContextMenuOptionsProvider {
    if (!this.contextMenuMap.has(priceAxis)) {
      this.contextMenuMap.set(priceAxis, new PriceAxisContextMenu(priceAxis));
    }

    return this.contextMenuMap.get(priceAxis) as ContextMenuOptionsProvider;
  }

  getTimeAxisContextMenu(): ContextMenuOptionsProvider {
    const { timeAxis } = this.controller;
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
    this.controller.onPaneSizeChanged(e);
  }

  onKeyDown(e: KeyboardEvent): void {
    // https://keyjs.dev/
    const isCommandKey: boolean = e.ctrlKey || e.metaKey;
    const isZKeyPressed: boolean = e.code === 'KeyZ';

    if (isZKeyPressed && isCommandKey) {
      e.preventDefault();
      if (e.shiftKey) {
        this.controller.redo();
      } else {
        this.controller.undo();
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
    } = this.controller.style;

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
