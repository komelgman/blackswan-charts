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
            :viewport-model="props.model"
            :interactions-handler="viewportInteractionsHandler"
            v-context-menu-directive="{
              model: getViewportContextMenu(props.model),
              instance: contextmenu,
            }"
          />

          <divider/>

          <price-axis-widget
            :price-axis="props.model.priceAxis"
            :data-source="props.model.dataSource"
            :interactions-handler="priceAxisInteractionsHandler"
            v-context-menu-directive="{
              model: getPriceAxisContextMenu(props.model.priceAxis),
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
          model: getTimeAxisContextMenu(),
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
import type { ContextMenuOptionsProvider } from '@/components/context-menu/types';
import { BoxLayout, Divider, Multipane } from '@/components/layout';
import type { PanesSizeChangedEvent } from '@/components/layout/events';
import { Direction, type PaneId } from '@/components/layout/types';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type { ChartState, Chart, PaneRegistrationEvent } from '@/model/chart/Chart';
import PriceAxisContextMenu from '@/model/chart/context-menu/PriceAxisContextMenu';
import TimeAxisContextMenu from '@/model/chart/context-menu/TimeAxisContextMenu';
import ViewportContextMenu from '@/model/chart/context-menu/ViewportContextMenu';
import PanesSizeChanged from '@/model/chart/incidents/PanesSizeChanged';
import { PRICE_LABEL_PADDING } from '@/model/chart/layers/PriceAxisLabelsLayer';
import type { ChartStyle } from '@/model/chart/types/styles';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { InteractionsHandler } from '@/model/chart/user-interactions/InteractionsHandler';
import type { MouseClickEvent, DragMoveEvent, ZoomEvent, MousePositionEvent } from '@/components/layered-canvas/events';
import type TimeAxis from '@/model/chart/axis/TimeAxis';

interface Props {
  chart: Chart;
}

const props = defineProps<Props>();
const rootElement = ref<ComponentPublicInstance>();
const contextmenu = ref();

const priceAxisInteractionsHandler: InteractionsHandler<PriceAxis> = {
  onLeftMouseBtnDoubleClick(source: PriceAxis, e: MouseClickEvent): void {
    console.log({ method: 'onLeftMouseBtnDoubleClick', source, e });
  },

  onDrag(source: PriceAxis, e: DragMoveEvent): void {
    source.zoom(e.elementHeight / 2, -e.dy);
  },

  onZoom(source: PriceAxis, e: ZoomEvent): void {
    source.zoom(e.pivot.y, e.delta);
  },

  onLeftMouseBtnClick(): void { },
  onMouseMove(): void { },
  onDragStart(): void { },
  onDragEnd(): void { },
};

const timeAxisInteractionsHandler: InteractionsHandler<TimeAxis> = {
  onLeftMouseBtnDoubleClick(source: TimeAxis, e: MouseClickEvent): void {
    console.log({ method: 'onLeftMouseBtnDoubleClick', source, e });
  },

  onDrag(source: TimeAxis, e: DragMoveEvent): void {
    source.zoom(e.elementWidth / 2, -e.dx);
  },

  onZoom(source: TimeAxis, e: ZoomEvent): void {
    source.zoom(e.pivot.x, e.delta);
  },

  onLeftMouseBtnClick(): void { },
  onMouseMove(): void { },
  onDragStart(): void { },
  onDragEnd(): void { },
};

const viewportInteractionsHandler: InteractionsHandler<Viewport> = {
  onMouseMove(source: Viewport, e: MousePositionEvent): void {
    source.highlightInvalidator.invalidate(e);
  },

  onLeftMouseBtnClick(source: Viewport, e: MouseClickEvent): void {
    source.updateSelection(e.isCtrl);
  },

  onLeftMouseBtnDoubleClick(source: Viewport): void {
    const { highlighted } = source;
    if (highlighted !== undefined) {
      console.log(`double click on element: ${highlighted.descriptor.ref}`);
    } else {
      console.log('double click on viewport');
    }
  },

  onDragStart(source: Viewport, e: MouseClickEvent): void {
    source.updateSelection(e.isCtrl, true);

    if (source.selectionCanBeDragged()) {
      source.dataSource.beginTransaction({ protocolTitle: 'drag-in-viewport' });

      if (e.isCtrl) {
        source.cloneSelected();
      }
    }
    source.updateDragHandle();
  },

  onDrag(source: Viewport, e: DragMoveEvent): void {
    if (source.selectionCanBeDragged()) {
      source.highlightInvalidator.invalidate(e);
      source.moveSelected(e);
    } else {
      const { timeAxis, priceAxis } = source;
      timeAxis.move(e.dx);
      priceAxis.move(e.dy);
    }
  },

  onDragEnd(source: Viewport): void {
    const { dataSource } = source;
    if (source.selectionCanBeDragged()) {
      dataSource.endTransaction();
    } else {
      dataSource.historicalIncidentReportProcessor({
        protocolOptions: { protocolTitle: 'move-in-viewport' },
        sign: true,
      });
    }
  },

  onZoom(source: Viewport, e: ZoomEvent): void {
    source.timeAxis.zoom(e.pivot.x, e.delta);
  },
};

const chartStyle = computed<ChartStyle>(() => props.chart.style);
provide('chartStyle', chartStyle);

const chartState = reactive<ChartState>({
  priceWidgetWidth: -1,
  timeWidgetHeight: -1,
});
provide('chartState', chartState);

const unwatchers = new Map<PaneId, WatchStopHandle[]>();
const contextMenuMap = new WeakMap<any, ContextMenuOptionsProvider>();
let unwatch: WatchStopHandle;

onMounted(() => {
  unwatch = watch(
    () => chartStyle.value.text.fontSize,
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

function getPriceAxisContextMenu(priceAxis: PriceAxis): ContextMenuOptionsProvider {
  if (!contextMenuMap.has(priceAxis)) {
    contextMenuMap.set(priceAxis, new PriceAxisContextMenu(priceAxis));
  }

  return contextMenuMap.get(priceAxis) as ContextMenuOptionsProvider;
}

function getTimeAxisContextMenu(): ContextMenuOptionsProvider {
  const { timeAxis } = props.chart;
  if (!contextMenuMap.has(timeAxis)) {
    contextMenuMap.set(timeAxis, new TimeAxisContextMenu(timeAxis));
  }

  return contextMenuMap.get(timeAxis) as ContextMenuOptionsProvider;
}

function getViewportContextMenu(viewport: Viewport): ContextMenuOptionsProvider {
  if (!contextMenuMap.has(viewport)) {
    contextMenuMap.set(viewport, new ViewportContextMenu(viewport));
  }

  return contextMenuMap.get(viewport) as ContextMenuOptionsProvider;
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
  props.chart.historicalIncidentReportProcessor({
    protocolOptions: { protocolTitle: 'chart-pane-size-changed', timeout: 1000 },
    incident: new PanesSizeChanged({
      event,
    }),
    immediate: false,
  });
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

function onKeyDown(e: KeyboardEvent): void {
  // https://keyjs.dev/
  const isCommandKey: boolean = e.ctrlKey || e.metaKey;
  const isZKeyPressed: boolean = e.code === 'KeyZ';

  if (isZKeyPressed && isCommandKey) {
    e.preventDefault();
    if (e.shiftKey) {
      props.chart.redo();
    } else {
      props.chart.undo();
    }
  }
}

const cssVars = computed(() => {
  const {
    backgroundColor,
    borderColor,
    resizeHandleColorOnHover,
    menuBackgroundColor,
    menuBackgroundColorOnHover,
  } = props.chart.style;

  return {
    '--primary-background-color': backgroundColor,
    '--border-color': borderColor,
    '--resize-handle-color-on-hover': resizeHandleColorOnHover,
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
