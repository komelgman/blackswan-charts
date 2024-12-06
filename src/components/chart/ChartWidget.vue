<template>
  <box-layout
    :direction="Direction.Vertical"
    :style="cssVars"
    ref="rootElement"
    @keydown="onKeyDown"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @contextmenu.prevent
    tabindex="0"
  >
    <ContextMenu ref="contextmenu"/>
    <multipane
      :items="chart.panes"
      :direction="Direction.Vertical"
      resizable
      @drag-handle-moved="onPaneSizeChanged"
      style="height: 100%"
    >
      <template v-slot:default="props">
        <box-layout>
          <viewport-widget
            :viewport="props.model"
            :interactions-handler="viewportInteractionsHandler"
            v-context-menu-directive="{
              model: userInteractions.getViewportContextMenu(props.model),
              instance: contextmenu,
            }"
          />

          <divider/>

          <price-axis-widget
            :price-axis="props.model.priceAxis"
            :data-source="props.model.dataSource"
            :interactions-handler="priceAxisInteractionsHandler"
            v-context-menu-directive="{
              model: userInteractions.getPriceAxisContextMenu(props.model.priceAxis),
              instance: contextmenu,
            }"
          />
        </box-layout>
      </template>
    </multipane>

    <divider/>

    <box-layout :style="timeLineStyle">
      <time-axis-widget
        :time-axis="chart.timeAxis"
        :interactions-handler="timeAxisInteractionsHandler"
        v-context-menu-directive="{
          model: userInteractions.getTimeAxisContextMenu(chart.timeAxis),
          instance: contextmenu,
        }"
      />

      <divider/>

      <div class="pane" :style="timeLineButtonPaneStyle"/>
    </box-layout>
  </box-layout>
</template>

<script setup lang="ts">
import {
  type ComponentPublicInstance,
  computed,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  watch,
  type WatchStopHandle,
} from 'vue';
import PriceAxisWidget from '@/components/chart/PriceAxisWidget.vue';
import TimeAxisWidget from '@/components/chart/TimeAxisWidget.vue';
import ViewportWidget from '@/components/chart/ViewportWidget.vue';
import ContextMenu from '@/components/context-menu/ContextMenu.vue';
import vContextMenuDirective from '@/components/context-menu/model/ContextMenuDirective';
import { BoxLayout, Divider, Multipane } from '@/components/layout';
import type { PanesSizeChangedEvent } from '@/components/layout/events';
import { Direction, type PaneId } from '@/components/layout/types';
import type { ChartState, Chart, PaneRegistrationEvent } from '@/model/chart/Chart';
import PanesSizeChanged from '@/model/chart/incidents/PanesSizeChanged';
import type { ChartStyle } from '@/model/chart/types/styles';
import { PRICE_LABEL_PADDING } from '@/model/chart/axis/layers/PriceAxisLabelsLayer';

interface Props {
  chart: Chart;
}

const props = defineProps<Props>();
const rootElement = ref<ComponentPublicInstance>();
const contextmenu = ref();
const { userInteractions } = props.chart;
const { priceAxisInteractionsHandler, timeAxisInteractionsHandler, viewportInteractionsHandler } = userInteractions;

const chartStyle = computed<ChartStyle>(() => props.chart.style);
provide('chartStyle', chartStyle);

const chartState = reactive<ChartState>({
  priceWidgetWidth: -1,
  timeWidgetHeight: -1,
});
provide('chartState', chartState);

const unwatchers = new Map<PaneId, WatchStopHandle[]>();
let unwatch: WatchStopHandle;

onMounted(() => {
  unwatch = watch(
    () => chartStyle.value.textStyle.fontSize,
    (v) => {
      chartState.timeWidgetHeight = v + 16;
    },
    { immediate: true },
  );

  props.chart.addPaneRegistrationEventListener(onPaneRegEventListener);

  for (const pane of props.chart.panes) {
    onPaneRegEventListener({
      type: 'install',
      pane,
    });
  }
});

onUnmounted(() => {
  (document.querySelector('body') as HTMLBodyElement).style.backgroundColor = '';

  props.chart.removePaneRegistrationEventListener(onPaneRegEventListener);

  for (const pane of props.chart.panes) {
    onPaneRegEventListener({
      type: 'uninstall',
      pane,
    });
  }

  unwatch();
});

function onKeyDown(e: KeyboardEvent): void {
  userInteractions.onKeyDown(e);
}

function onMouseEnter(): void {
  if (rootElement.value) {
    rootElement.value.$el.focus();
  }
}

function onMouseLeave(): void {
  if (rootElement.value) {
    rootElement.value.$el.blur();
  }
}

function onPaneSizeChanged(event: PanesSizeChangedEvent): void {
  props.chart.transactionManager.transact({
    protocolOptions: { protocolTitle: 'chart-pane-size-changed', timeout: 1000 },
    incident: new PanesSizeChanged({
      event,
    }),
    immediate: false,
  }, { signOnClose: false });
}

function onPaneRegEventListener(event: PaneRegistrationEvent): void {
  const { pane, type } = event;
  if (type === 'install') {
    if (!unwatchers.has(pane.id)) {
      unwatchers.set(pane.id, []);
    }

    (unwatchers.get(pane.id) as WatchStopHandle[]).push(
      watch(pane.model.priceAxis.contentWidth, updatePriceAxisWidth, { immediate: true }),
    );
  } else {
    if (!unwatchers.has(pane.id)) {
      throw new Error(`Oops: !this.unwatchers.has(${pane.id})`);
    }

    for (const unwatchCallback of (unwatchers.get(pane.id) as WatchStopHandle[])) {
      unwatchCallback();
    }
  }
}

function updatePriceAxisWidth(): void {
  let maxLabelWidth = -1;
  for (const pane of props.chart.panes) {
    const labelWidth: number = pane.model.priceAxis.contentWidth.value;
    if (maxLabelWidth < labelWidth) {
      maxLabelWidth = labelWidth;
    }
  }

  chartState.priceWidgetWidth = maxLabelWidth + 2 * PRICE_LABEL_PADDING;
}

const cssVars = computed(() => {
  const {
    backgroundColor,
    borderColor,
    hoveredResizeHandleColor,
    menu: {
      backgroundColor: menuBackgroundColor,
      hoveredItemColor: menuBackgroundColorOnHover,
    },
    viewport: {
      backgroundColor: viewportBackgroundColor,
    },
    priceAxis: {
      backgroundColor: priceAxisBackgroundColor,
    } = {},
    timeAxis: {
      backgroundColor: timeAxisBackgroundColor,
    } = {},
  } = props.chart.style;

  return {
    backgroundColor: timeAxisBackgroundColor ?? backgroundColor,
    '--primary-background-color': backgroundColor,
    '--viewport-background-color': viewportBackgroundColor,
    '--price-axis-background-color': priceAxisBackgroundColor,
    '--time-axis-background-color': timeAxisBackgroundColor,
    '--border-color': borderColor,
    '--resize-handle-color-on-hover': hoveredResizeHandleColor,
    '--menu-background-color': menuBackgroundColor,
    '--menu-background-color-on-hover': menuBackgroundColorOnHover,
  };
});

const timeLineStyle = computed(() => ({
  maxHeight: `${chartState.timeWidgetHeight}px`,
  minHeight: `${chartState.timeWidgetHeight}px`,
  height: `${chartState.timeWidgetHeight}px`,
}));

const timeLineButtonPaneStyle = computed(() => ({
  display: 'flex',
  flex: '1 1 auto',
  maxWidth: `${chartState.priceWidgetWidth}px`,
  minWidth: `${chartState.priceWidgetWidth}px`,
  width: `${chartState.priceWidgetWidth}px`,
}));
</script>
