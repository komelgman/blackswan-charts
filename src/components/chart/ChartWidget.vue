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
      :items="controller.panes"
      direction="vertical"
      resizable
      @drag-handle-moved="onPaneSizeChanged"
    >
      <template v-slot:default="props">
        <box-layout>
          <viewport-widget
            :paneId="props.paneId"
            :viewport-model="props.model"
            v-contextmenu="{
              model: getViewportContextMenu(props.model),
              instance: $refs['contextmenu']
            }"
          />

          <divider/>

          <price-axis-widget
            :viewport-model="props.model"
            v-contextmenu="{
              model: getPriceAxisContextMenu(props.model.priceAxis),
              instance: $refs['contextmenu']
            }"
          />
        </box-layout>
      </template>
    </multipane>

    <divider/>

    <box-layout :style="timeLineStyle">
      <time-axis-widget
        :time-axis="controller.timeAxis"
        v-contextmenu="{
          model: getTimeAxisContextMenu(),
          instance: $refs['contextmenu']
        }"
      />

      <divider/>

      <div class="pane" :style="timeLineButtonPaneStyle"></div>
    </box-layout>
  </box-layout>
</template>

<script lang="ts">
import PriceAxisWidget from '@/components/chart/PriceAxisWidget.vue';
import TimeAxisWidget from '@/components/chart/TimeAxisWidget.vue';
import ViewportWidget from '@/components/chart/ViewportWidget.vue';
import ContextMenu from '@/components/context-menu/ContextMenu.vue';
import contextMenuDirective from '@/components/context-menu/ContextMenuDirective';
import { ContextMenuOptionsProvider } from '@/components/context-menu/ContextMenuOptions';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import { BoxLayout, Divider, Multipane } from '@/components/layout';
import { PanesSizeChangeEvent } from '@/components/layout/PanesSizeChangedEvent';
import { clone, DeepPartial, merge } from '@/misc/strict-type-checks';
import PriceAxis from '@/model/axis/PriceAxis';
import ChartController from '@/model/ChartController';
import ChartState from '@/model/ChartState';
import { ChartStyle } from '@/model/ChartStyle';
import chartOptionsDefaults from '@/model/ChartStyle.Defaults';
import PriceAxisContextMenu from '@/model/context-menu/PriceAxisContextMenu';
import TimeAxisContextMenu from '@/model/context-menu/TimeAxisContextMenu';
import ViewportContextMenu from '@/model/context-menu/ViewportContextMenu';
import { DrawingType } from '@/model/datasource/Drawing';
import Sketcher from '@/model/sketchers/Sketcher';
import sketcherDefaults from '@/model/sketchers/Sketcher.Defaults';
import Viewport from '@/model/viewport/Viewport';
import { CSSProperties, reactive } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { Prop, ProvideReactive, Ref } from 'vue-property-decorator';

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
  private controller!: ChartController;
  @ProvideReactive()
  private chartStyle!: ChartStyle;
  @ProvideReactive()
  private chartState!: ChartState;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private contextMenuMap: WeakMap<any, ContextMenuOptionsProvider> = new WeakMap<any, ContextMenuOptionsProvider>();

  @ProvideReactive()
  private sketchers!: Map<DrawingType, Sketcher>;

  public created(): void {
    this.chartStyle = this.createChartStyleOptions();
    this.sketchers = this.createSketchersOptions();

    this.chartState = reactive({
      priceWidgetWidth: -1,
      timeWidgetHeight: -1,
    });

    this.controller = new ChartController(this.chartState, this.chartStyle, this.sketchers);
  }

  mounted(): void {
    const htmlBodyElement: HTMLBodyElement = document.querySelector('body') as HTMLBodyElement;
    htmlBodyElement.style.backgroundColor = this.chartStyle.backgroundColor;
  }

  unmounted(): void {
    (document.querySelector('body') as HTMLBodyElement).style.backgroundColor = '';
  }

  public getChartAPI(): ChartController {
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

  private getPriceAxisContextMenu(priceAxis: PriceAxis): ContextMenuOptionsProvider {
    if (!this.contextMenuMap.has(priceAxis)) {
      this.contextMenuMap.set(priceAxis, new PriceAxisContextMenu(priceAxis));
    }

    return this.contextMenuMap.get(priceAxis) as ContextMenuOptionsProvider;
  }

  private getTimeAxisContextMenu(): ContextMenuOptionsProvider {
    const { timeAxis } = this.controller;
    if (!this.contextMenuMap.has(timeAxis)) {
      this.contextMenuMap.set(timeAxis, new TimeAxisContextMenu(timeAxis));
    }

    return this.contextMenuMap.get(timeAxis) as ContextMenuOptionsProvider;
  }

  private getViewportContextMenu(viewport: Viewport): ContextMenuOptionsProvider {
    if (!this.contextMenuMap.has(viewport)) {
      this.contextMenuMap.set(viewport, new ViewportContextMenu(viewport));
    }

    return this.contextMenuMap.get(viewport) as ContextMenuOptionsProvider;
  }

  private onMouseEnter(): void {
    this.$el.focus();
  }

  private onMouseLeave(): void {
    this.$el.blur();
  }

  private onPaneSizeChanged(e: PanesSizeChangeEvent): void {
    this.controller.onPaneSizeChanged(e);
  }

  private onKeyDown(e: KeyboardEvent): void {
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
