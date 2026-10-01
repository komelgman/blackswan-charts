<template>
  <box-layout ref="rootElement" :direction="direction" :style="style">
    <template v-for="(item, index) in visibleItems" :key="`item-${item.id}`">
      <divider ref="borderElements" v-if="index !== 0">
        <resize-handle :index="index" v-if="resizable" @resize-move="onResizeHandleMove"/>
      </divider>

      <div ref="paneElements" class="pane" :data-index="index" :data-testid="`pane${index}`" :style="paneStyle(item)">
        <slot :model="item.model" :paneId="item.id"/>
      </div>
    </template>
  </box-layout>
</template>

<script lang="ts" setup>
import ResizeObserver from 'resize-observer-polyfill';
import { type ComponentPublicInstance, computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import BoxLayout from './BoxLayout.vue';
import Divider from './Divider.vue';
import ResizeHandle from './ResizeHandle.vue';
import type { PanesSizeChangedEvent, ResizeHandleMoveEvent } from '../model/events';
import { Direction, type PaneDescriptor } from '../model/types';
import { layoutPanes, resizePanes } from '../model/pane-layout';

export interface Props {
  resizable?: boolean;
  direction?: Direction;
  items: PaneDescriptor<any>[];
}

const props = withDefaults(defineProps<Props>(), {
  resizable: false,
  direction: Direction.Vertical,
});
const emit = defineEmits<(e: 'drag-handle-moved', event: PanesSizeChangedEvent) => void>();
const rootElement = ref<ComponentPublicInstance>();
const paneElements = ref<HTMLElement[]>([]);
const borderElements = ref<ComponentPublicInstance[]>([]);
const layout = reactive<{ minSize?: number; maxSize?: number }>({});
const style = computed(() => {
  const result: any = {};

  const minSize = layout.minSize === undefined ? undefined : `${layout.minSize}px`;
  const maxSize = layout.maxSize === undefined ? undefined : `${layout.maxSize}px`;

  if (props.direction === Direction.Horizontal) {
    result.minWidth = minSize;
    result.minHeight = undefined;
    result.maxWidth = maxSize;
    result.maxHeight = undefined;
  } else {
    result.minHeight = minSize;
    result.minWidth = undefined;
    result.maxHeight = maxSize;
    result.maxWidth = undefined;
  }

  return result;
});
const visibleItems = computed(() => props.items.filter((item) => item.visible === undefined || item.visible));
const resizeObserver: ResizeObserver = new ResizeObserver(invalidate);

let valid: boolean = true;

onMounted(() => {
  if (!rootElement.value) {
    throw new Error('rootElement must be present');
  }

  resizeObserver.observe(rootElement.value.$el);
});

onUnmounted(() => {
  resizeObserver.disconnect();
});

watch(visibleItems, invalidate);

function paneElementsGetSortedByIndex(): HTMLElement[] {
  return paneElements.value
    ? paneElements.value.sort((a, b) => (a.dataset.index as any) - (b.dataset.index as any))
    : [];
}

function paneStyle(desc: PaneDescriptor<unknown>): any {
  const sizeCaption = props.direction === Direction.Horizontal ? 'width' : 'height';
  const result: any = {};

  result[`min-${sizeCaption}`] = `${desc.minSize}px`;
  result[`max-${sizeCaption}`] = `${desc.maxSize}px`;
  result[`${sizeCaption}`] = `${desc.size}px`;

  return result;
}

function invalidate(): void {
  if (valid) {
    valid = false;
    nextTick(adjustPanesSizes);
  }
}

function adjustPanesSizes(): void {
  valid = true;
  const result = layoutPanes(props.items, getSize(rootElement.value?.$el), getBordersSize());
  layout.minSize = result.minSize;
  layout.maxSize = result.maxSize;
}

function onResizeHandleMove(e: ResizeHandleMoveEvent): void {
  const delta = props.direction === Direction.Vertical ? e.dy : e.dx;
  const result = resizePanes(visibleItems.value, e.index, delta, getSize(rootElement.value?.$el), getBordersSize());
  const elements = paneElementsGetSortedByIndex();
  visibleItems.value.forEach((item, index) => setSize(elements[index], item.size as number));
  if (result.constrained) e.allowDrag();
  emit('drag-handle-moved', {
    source: { invalidate, visibleItems: visibleItems.value },
    initial: result.initial,
    changed: result.changed,
  });
}

function getBordersSize(): number {
  let bordersSize = 0;
  for (let i = 0; i < borderElements.value?.length || 0; i += 1) {
    bordersSize += getSize(borderElements.value[i].$el);
  }
  return bordersSize;
}

function getSize(el: HTMLElement | undefined): number {
  if (el === undefined) {
    return 0;
  }

  // Pane sizes and pointer deltas are CSS pixels; DPR belongs to canvas rendering.
  const rect: DOMRect = el.getBoundingClientRect();
  return props.direction === Direction.Horizontal ? rect.width : rect.height;
}

function setSize(el: HTMLElement | undefined, size: number): void {
  if (el === undefined) {
    return;
  }

  if (props.direction === Direction.Horizontal) {
    el.style.width = `${size}px`;
  } else {
    el.style.height = `${size}px`;
  }
}
</script>

<style lang="scss">
.boxlayout > {
  .pane {
    display: flex;
    flex: 1 1 auto;
    position: relative;
  }
}
</style>
