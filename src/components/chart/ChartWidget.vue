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
    <multipane :items="controller.panes" direction="vertical" resizable>
      <template v-slot:default="props">
        <box-layout>
          <viewport-widget
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
import { Options, Vue } from 'vue-class-component';
import { Prop, ProvideReactive } from 'vue-property-decorator';
import TimeAxisWidget from '@/components/chart/TimeAxisWidget.vue';
import { BoxLayout, Divider, Multipane } from '@/components/layout';
import PriceAxisWidget from '@/components/chart/PriceAxisWidget.vue';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import ViewportWidget from '@/components/chart/ViewportWidget.vue';
import { clone, DeepPartial, merge } from '@/misc/strict-type-checks';
import chartOptionsDefaults from '@/model/ChartStyle.Defaults';
import ChartController from '@/model/ChartController';
import { CSSProperties, reactive } from 'vue';
import ChartState from '@/model/ChartState';
import contextMenuDirective from '@/components/context-menu/ContextMenuDirective';
import ContextMenu from '@/components/context-menu/ContextMenu.vue';
import Sketcher from '@/model/datasource/Sketcher';
import { DrawingType } from '@/model/datasource/Drawing';
import { ChartStyle } from '@/model/ChartStyle';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import PriceAxis from '@/model/axis/PriceAxis';
import { ContextMenuOptionsProvider } from '@/components/context-menu/ContextMenuOptions';
import PriceAxisContextMenu from '@/model/context-menu/PriceAxisContextMenu';
import TimeAxisContextMenu from '@/model/context-menu/TimeAxisContextMenu';
import Viewport from '@/model/viewport/Viewport';
import ViewportContextMenu from '@/model/context-menu/ViewportContextMenu';

export declare type ChartOptions = { style: DeepPartial<ChartStyle>, sketchers: Map<DrawingType, Sketcher> };

@Options({
  components: {
    ViewportWidget, TimeAxisWidget, BoxLayout, Multipane, PriceAxisWidget, Divider, LayeredCanvas, ContextMenu,
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
  @ProvideReactive()
  private tva!: TimeVarianceAuthority;

  private contextMenuMap: WeakMap<any, ContextMenuOptionsProvider>
    = new WeakMap<any, ContextMenuOptionsProvider>();

  @ProvideReactive()
  private sketchers!: Map<DrawingType, Sketcher>;

  public created(): void {
    this.sketchers = this.createSketchersOptions();
    this.chartStyle = this.createChartStyleOptions();
    this.tva = new TimeVarianceAuthority();

    this.chartState = reactive({
      priceWidgetWidth: -1,
      timeWidgetHeight: -1,
    });

    this.controller = new ChartController(this.chartState, this.chartStyle, this.tva, this.sketchers);
  }

  private createChartStyleOptions(): ChartStyle {
    if (this.options && this.options.style) {
      return reactive(merge(clone(chartOptionsDefaults), this.options.style)[0] as ChartStyle)
    }

    return reactive(clone(chartOptionsDefaults));
  }

  private getPriceAxisContextMenu(priceAxis: PriceAxis): ContextMenuOptionsProvider {
    if (!this.contextMenuMap.has(priceAxis)) {
      this.contextMenuMap.set(priceAxis, new PriceAxisContextMenu(this.tva, priceAxis));
    }

    return this.contextMenuMap.get(priceAxis) as ContextMenuOptionsProvider;
  }

  private getTimeAxisContextMenu(): ContextMenuOptionsProvider {
    const { timeAxis } = this.controller;
    if (!this.contextMenuMap.has(timeAxis)) {
      this.contextMenuMap.set(timeAxis, new TimeAxisContextMenu(this.tva, timeAxis));
    }

    return this.contextMenuMap.get(timeAxis) as ContextMenuOptionsProvider;
  }

  private getViewportContextMenu(viewport: Viewport): ContextMenuOptionsProvider {
    if (!this.contextMenuMap.has(viewport)) {
      this.contextMenuMap.set(viewport, new ViewportContextMenu(this.tva, viewport));
    }

    return this.contextMenuMap.get(viewport) as ContextMenuOptionsProvider;
  }

  private createSketchersOptions(): Map<DrawingType, Sketcher> {
    const result: Map<DrawingType, Sketcher> = new Map();

    // todo set default

    if (this.options && this.options.sketchers) {
      this.options.sketchers.forEach((value, key) => result.set(key, value));
    }

    return result;
  }

  private onMouseEnter(): void {
    this.$el.focus();
  }

  private onMouseLeave(): void {
    this.$el.blur();
  }

  private onKeyDown(e: KeyboardEvent): void {
    const isCommandKey: boolean = e.ctrlKey || e.metaKey;
    const isZKeyPressed: boolean = e.key === 'z' || e.key === 'Z';

    if (isZKeyPressed && isCommandKey) {
      e.preventDefault();
      if (e.shiftKey) {
        this.controller.redo();
      } else {
        this.controller.undo();
      }
    }
  }

  public getChartAPI(): ChartController {
    return this.controller;
  }

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
