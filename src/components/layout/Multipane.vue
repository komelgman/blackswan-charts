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
import { type ComponentPublicInstance, computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { BoxLayout, Divider, ResizeHandle } from '@/components/layout';
import type { PanesSizeChangedEvent, ResizeHandleMoveEvent } from '@/components/layout/events';
import { Direction, type PaneDescriptor } from '@/components/layout/types';

interface PaneInfo {
  paneDesc: PaneDescriptor<any>;
  min: number;
  max: number;
  targetSize: number;
  retrievedSize: number;
}

interface InitialParamsForVisiblePanes {
  suPanes: PaneInfo[];
  suMin: number;
  suMax: number;
  snuPanes: PaneInfo[];
  snuRetrieved: number;
  snuMin: number;
  snuMax: number;
  availableSize: number;
  bordersSize: number;
}

interface Layout {
  minSize: number | undefined;
  maxSize: number | undefined;
}

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
const layout: Layout = {
  minSize: undefined,
  maxSize: undefined,
};
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

  const {
    suPanes,
    suMin,
    suMax,
    snuPanes,
    snuRetrieved,
    snuMin,
    snuMax,
    availableSize,
    bordersSize,
  } = getInitialParamsForVisiblePanes();

  const targetSize = availableSize - bordersSize;
  if ((suMin + snuMin) > targetSize) {
    throw new Error('No enough space for panes');
  }

  if ((suMax + snuMax) < targetSize) {
    throw new Error('Maximum panes size less than available size');
  }

  let snuSize = snuRetrieved;
  if (snuRetrieved + suMin > targetSize) {
    snuSize = resize(snuPanes, snuSize, targetSize - suMin);
  }

  if (snuRetrieved + suMax < targetSize) {
    snuSize = resize(snuPanes, snuSize, targetSize - suMax);
  }

  const suRetrieved = targetSize - snuSize;
  for (const pane of suPanes) {
    pane.retrievedSize = suRetrieved / suPanes.length;
  }

  resize(suPanes, suRetrieved, suRetrieved);

  // update layout min|max size options
  const minimumSize = snuMin + suMin;
  if (minimumSize > 0) {
    layout.minSize = (minimumSize + bordersSize) * getDPR();
  } else {
    layout.minSize = undefined;
  }

  const maximumSize = snuMax + suMax;
  if (maximumSize > 0 && maximumSize < Number.MAX_VALUE) {
    layout.maxSize = (maximumSize + bordersSize) * getDPR();
  } else {
    layout.maxSize = undefined;
  }

  // fix inaccuracy and apply size
  let computedSize = 0;
  const panes = [...suPanes, ...snuPanes];
  for (const info of panes) {
    computedSize += info.targetSize;
  }

  let fix = targetSize - computedSize;
  for (const info of panes) {
    let size = info.targetSize;

    if ((size + fix) >= info.min && (size + fix) <= info.max) {
      size += fix;
      fix = 0;
    }

    info.paneDesc.size = size;
  }
}

function resize(paneInfos: PaneInfo[], retrievedSize: number, targetSize: number) {
  const scale = targetSize / retrievedSize;
  let sizeThatShouldBeDistributed: number = 0;
  let panesAvailableForStretch = paneInfos.length;
  let panesAvailableForShrink = paneInfos.length;

  // scale elements size to screen size
  for (const info of paneInfos) {
    let size = info.retrievedSize * scale;

    if (size > info.max) {
      sizeThatShouldBeDistributed += size - info.max;
      size = info.max;
    }

    if (size < info.min) {
      sizeThatShouldBeDistributed -= info.min - size;
      size = info.min;
    }

    if (size === info.max) {
      panesAvailableForStretch -= 1;
    }

    if (size === info.min) {
      panesAvailableForShrink -= 1;
    }

    info.targetSize = size;
  }

  // stretch/shrink not distributed space
  const eps = 0.00001;

  // shrink
  let circleBreaker = 100;
  while ((sizeThatShouldBeDistributed + eps) < 0 && panesAvailableForShrink > 0) {
    const dSize = -sizeThatShouldBeDistributed / panesAvailableForShrink;

    for (const info of paneInfos) {
      if (info.min === info.targetSize) {
        continue;
      }

      let size = info.targetSize - dSize;
      if (size <= info.min) {
        size = info.min;
        panesAvailableForShrink -= 1;
      }

      sizeThatShouldBeDistributed += info.targetSize - size;
      info.targetSize = size;
    }

    circleBreaker -= 1;
    if (circleBreaker === 0) {
      throw new Error('shrink infinite loop');
    }
  }

  // stretch
  circleBreaker = 100;
  while ((sizeThatShouldBeDistributed - eps) > 0 && panesAvailableForStretch > 0) {
    const dSize = sizeThatShouldBeDistributed / panesAvailableForStretch;

    for (const info of paneInfos) {
      if (info.max === info.targetSize) {
        continue;
      }

      let size = info.targetSize + dSize;
      if (size >= info.max) {
        size = info.max;
        panesAvailableForStretch -= 1;
      }

      sizeThatShouldBeDistributed -= size - info.targetSize;
      info.targetSize = size;
    }

    circleBreaker -= 1;
    if (circleBreaker === 0) {
      throw new Error('stretch infinite loop');
    }
  }

  let result = 0;
  for (const info of paneInfos) {
    result += info.targetSize;
  }

  return result;
}

function getInitialParamsForVisiblePanes(): InitialParamsForVisiblePanes {
  const currentVisibleItems = props.items;
  const availableSize = getSize(rootElement.value?.$el);
  const bordersSize = getBordersSize();
  const size = availableSize - bordersSize;
  const suPanes: PaneInfo[] = [];
  const snuPanes: PaneInfo[] = [];

  let snuRetrieved = 0;
  let suMin = 0;
  let snuMin = 0;
  let suMax = 0;
  let snuMax = 0;

  for (let i = 0; i < currentVisibleItems?.length || 0; i += 1) {
    const paneDesc = currentVisibleItems[i];

    if (paneDesc.minSize === undefined) {
      paneDesc.minSize = 1;
    }

    if (paneDesc.maxSize === undefined) {
      paneDesc.maxSize = Number.MAX_VALUE;
    }

    if (paneDesc.preferredSize) {
      const retrievedSize = size * paneDesc.preferredSize;
      snuRetrieved += retrievedSize;
      snuMin += paneDesc.minSize;
      snuMax = paneDesc.maxSize === Number.MAX_VALUE ? Number.MAX_VALUE : snuMax + paneDesc.maxSize;

      snuPanes.push({
        paneDesc,
        min: paneDesc.minSize,
        max: paneDesc.maxSize,
        retrievedSize,
        targetSize: retrievedSize,
      });
    } else {
      suMin += paneDesc.minSize;
      suMax = paneDesc.maxSize === Number.MAX_VALUE ? Number.MAX_VALUE : suMax + paneDesc.maxSize;

      suPanes.push({
        paneDesc,
        min: paneDesc.minSize,
        max: paneDesc.maxSize,
        retrievedSize: 0,
        targetSize: 0,
      });
    }
  }

  return {
    suPanes,
    suMax,
    suMin,
    snuPanes,
    snuRetrieved,
    snuMax,
    snuMin,
    availableSize,
    bordersSize,
  };
}

function onResizeHandleMove(e: ResizeHandleMoveEvent): void {
  const availableSize = getSize(rootElement.value?.$el);
  const bordersSize = getBordersSize();
  const items = visibleItems.value;
  const initialSizes = items.map((v) => ({ preferred: v.preferredSize, current: v.size }));
  const dsize = (props.direction === Direction.Vertical ? e.dy : e.dx) * getDPR();
  const deltaSign = Math.sign(dsize);
  const sortedPaneElements = paneElementsGetSortedByIndex();
  let deltaSize = Math.abs(dsize);

  while (deltaSize > 0) {
    const decPaneIndex: number | undefined = getDecPaneIndex(deltaSign, e.index, items);
    const incPaneIndex: number | undefined = getIncPaneIndex(deltaSign, e.index, items);

    if (decPaneIndex === undefined || incPaneIndex === undefined) {
      e.allowDrag();
      break;
    }

    const decItem: PaneDescriptor<any> = items[decPaneIndex];
    const incItem: PaneDescriptor<any> = items[incPaneIndex];
    if (decItem.size === undefined || incItem.size === undefined
        || decItem.minSize === undefined || incItem.maxSize === undefined) {
      throw new Error('oops');
    }

    let shouldBeDistributed = 0;
    if (decItem.size - deltaSize < decItem.minSize) {
      shouldBeDistributed = deltaSize - (decItem.size - decItem.minSize);
      deltaSize -= shouldBeDistributed;
    }

    if (incItem.size + deltaSize > incItem.maxSize) {
      const sbdDelta = deltaSize - (incItem.maxSize - incItem.size);
      shouldBeDistributed += sbdDelta;
      deltaSize -= sbdDelta;
    }

    decItem.size -= deltaSize;
    incItem.size += deltaSize;

    decItem.preferredSize = decItem.size / (availableSize - bordersSize);
    incItem.preferredSize = incItem.size / (availableSize - bordersSize);

    setSize(sortedPaneElements[decPaneIndex], decItem.size);
    setSize(sortedPaneElements[incPaneIndex], incItem.size);

    deltaSize = shouldBeDistributed;
  }

  const changedSizes = items.map((v) => ({ preferred: v.preferredSize, current: v.size }));

  emit('drag-handle-moved', {
    source: { invalidate, visibleItems: visibleItems.value },
    initial: initialSizes,
    changed: changedSizes,
  } as PanesSizeChangedEvent);
}

function getDecPaneIndex(sign: number, index: number, items: PaneDescriptor<any>[]): number | undefined {
  const change = sign > 0 ? 1 : -1;
  let dec: number | undefined = index;
  if (change < 0) {
    dec += change;
  }

  while (dec >= 0 && dec < items.length) {
    const info = items[dec];
    if (info.minSize !== info.size) {
      return dec;
    }
    dec += change;
  }

  return undefined;
}

function getIncPaneIndex(sign: number, index: number, items: PaneDescriptor<any>[]): number | undefined {
  const change = sign < 0 ? 1 : -1;
  let inc: number | undefined = index;
  if (change < 0) {
    inc += change;
  }

  while (inc >= 0 && inc < items.length) {
    const info = items[inc];
    if (info.maxSize !== info.size) {
      return inc;
    }
    inc += change;
  }

  return undefined;
}

function getBordersSize(): number {
  let bordersSize = 0;
  for (let i = 0; i < borderElements.value?.length || 0; i += 1) {
    bordersSize += getSize(borderElements.value[i].$el);
  }
  return bordersSize;
}

function getDPR(): number {
  return window.devicePixelRatio || 1;
}

function getSize(el: HTMLElement | undefined): number {
  if (el === undefined) {
    return 0;
  }

  const rect: DOMRect = el.getBoundingClientRect();
  return (props.direction === Direction.Horizontal ? rect.width : rect.height) * getDPR();
}

function setSize(el: HTMLElement | undefined, size: number): void {
  if (el === undefined) {
    return;
  }

  if (props.direction === Direction.Horizontal) {
    el.style.width = `${size / getDPR()}px`;
  } else {
    el.style.height = `${size / getDPR()}px`;
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
