<template>
  <div ref="rootElement" class="context-menu" :style="style">
    <ul>
      <component :is="item" v-for="item in renderItems()" :key="item.id" />
    </ul>
  </div>
</template>

<script setup lang="tsx">
import { computed, type ComputedRef, inject, nextTick, onUnmounted, ref } from 'vue';
import CheckboxMenuItem from '@/components/context-menu/CheckboxMenuItem.vue';
import SimpleMenuItem from '@/components/context-menu/SimpleMenuItem.vue';
import type { MenuItem } from '@/components/context-menu/types';
import type { EventRemover } from '@/model/misc/document-listeners';
import { onceDocument } from '@/model/misc/document-listeners';
import { makeFont } from '@/model/misc/function.makeFont';
import type { ChartStyle } from '@/model/chart/types/styles';
import type { Point } from '@/model/chart/types';

const rootElement = ref<HTMLDivElement>();
const HIDDEN_POS: Point = { x: -10000, y: 0 };
const position = ref<Point>(HIDDEN_POS);
const items = ref<MenuItem[]>([]);
const visible = ref<boolean>(false);
const chartStyle = inject<ComputedRef<ChartStyle>>('chartStyle');

let removeHideListener: EventRemover | undefined;

onUnmounted(() => {
  if (typeof removeHideListener === 'function') {
    removeHideListener();
    removeHideListener = undefined;
  }
});

const show = (event: MouseEvent, newItems: MenuItem[]): void => {
  items.value.splice(0, items.value.length, ...newItems);
  removeHideListener = onceDocument('mousedown', hide);
  visible.value = items.value.length > 0;

  nextTick(() => {
    position.value = calcPosition(event);
  });
};

const hide = (): void => {
  visible.value = false;
  position.value = HIDDEN_POS;

  if (typeof removeHideListener === 'function') {
    removeHideListener();
  }
};

const calcPosition = (event: MouseEvent): Point => {
  const width = rootElement.value?.clientWidth || 0;
  const height = rootElement.value?.clientHeight || 0;
  const result: Point = {
    x: event.pageX,
    y: event.pageY,
  };

  if (height + result.y >= window.innerHeight + window.scrollY) {
    const targetTop = result.y - height;

    if (targetTop > window.scrollY) {
      result.y = targetTop;
    }
  }

  if (width + result.x >= window.innerWidth + window.scrollX) {
    const targetWidth = result.x - width;

    if (targetWidth > window.scrollX) {
      result.x = targetWidth;
    }
  }

  return result;
};

const style = computed(() => {
  if (!chartStyle?.value) {
    return { };
  }

  const { textStyle } = (chartStyle.value!);

  return {
    font: makeFont(textStyle),
    color: textStyle.color,
    display: visible.value ? 'block' : 'none',
    paddingLeft: '26px',
    top: `${position.value.y}px`,
    left: `${position.value.x}px`,
  };
});

const renderItems = (): any[] => items.value.map((item) => {
  switch (item.type) {
    case 'item':
      return <SimpleMenuItem model={item} />;
    case 'checkbox':
      return <CheckboxMenuItem model={item} />;
    default:
      return <span>error</span>;
  }
});

defineExpose({
  show,
  hide,
});
</script>

<style scoped lang="scss">
$background-color: var(--menu-background-color);

.context-menu {
  position: fixed;
  z-index: 999;
  outline: none;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  padding: 4px;
  min-width: 178px;

  background: $background-color;
}
</style>
