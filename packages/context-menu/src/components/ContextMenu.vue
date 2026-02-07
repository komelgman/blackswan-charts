<template>
  <div ref="rootElement" class="context-menu" :style="style">
    <ul>
      <component :is="item" v-for="item in renderItems()" :key="item.id" />
    </ul>
  </div>
</template>

<script setup lang="tsx">
import { computed, nextTick, onUnmounted, ref } from 'vue';
import CheckboxMenuItem from './CheckboxMenuItem.vue';
import SimpleMenuItem from './SimpleMenuItem.vue';
import type { MenuItem } from '../types';
import { onceDocument, type EventRemover, type Point } from '@blackswan/foundation';


const rootElement = ref<HTMLDivElement>();
const HIDDEN_POS: Point = { x: -10000, y: 0 };
const position = ref<Point>(HIDDEN_POS);
const items = ref<MenuItem[]>([]);
const visible = ref<boolean>(false);

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
  return {
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

  color: var(--chart-text-color);
  font: var(--chart-font);
  background: $background-color;
}
</style>
