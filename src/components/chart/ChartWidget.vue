<template>
  <box-layout direction="vertical" @contextmenu.prevent :style="cssVars">
    <ContextMenu ref="contextmenu"/>
    <multipane :items="controller.panes" direction="vertical" resizable>
      <template v-slot:default="props">
        <box-layout>
          <viewport-widget
            :viewport-model="props.model"
            v-contextmenu="{ model: props.model, instance: $refs['contextmenu'] }"
          />

          <divider/>

          <price-axis-widget
            :viewport-model="props.model"
            v-contextmenu="{ model: props.model.priceAxis, instance: $refs['contextmenu'] }"
          />
        </box-layout>
      </template>
    </multipane>

    <divider/>

    <box-layout :style="timeLineStyle">
      <time-axis-widget
        :time-axis="controller.timeAxis"
        v-contextmenu="{ model: controller.timeAxis, instance: $refs['contextmenu'] }"
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
  private sketchers!: Map<DrawingType, Sketcher>;

  public created(): void {
    this.sketchers = this.createSketchersOptions();
    this.chartStyle = this.createChartStyleOptions();

    this.chartState = reactive({
      priceWidgetWidth: -1,
      timeWidgetHeight: -1,
    });

    this.controller = new ChartController(this.chartState, this.chartStyle, this.sketchers);
  }

  private createChartStyleOptions(): ChartStyle {
    if (this.options && this.options.style) {
      return reactive(merge(clone(chartOptionsDefaults), this.options.style) as ChartStyle)
    }

    return reactive(clone(chartOptionsDefaults));
  }

  private createSketchersOptions(): Map<DrawingType, Sketcher> {
    const result: Map<DrawingType, Sketcher> = new Map();

    // todo set default

    if (this.options && this.options.sketchers) {
      this.options.sketchers.forEach((value, key) => result.set(key, value));
    }

    return result;
  }

  mounted(): void {
    // install listeners there
  }

  unmounted(): void {
    // uninstall listeners there
  }

  public updateStyle(options: DeepPartial<ChartStyle>): void {
    merge(this.chartStyle, options);
  }

  public updateState(options: DeepPartial<ChartState>): void {
    merge(this.chartState, options);
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
