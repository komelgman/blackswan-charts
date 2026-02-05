<template>
  <a
    tabindex="0"
    class="simple-menu-item"
    :style="model.style"
    @click="model.onclick"
    @keypress="onKeyPress"
  >
    <renderIcon />
    {{ model.title }}
  </a>
</template>

<script setup lang="ts">
import { type VNode } from 'vue';
import type { SimpleMenuItemModel } from '@/components/context-menu/types';

export interface Props {
  model: SimpleMenuItemModel;
}

const { model } = defineProps<Props>();

function onKeyPress(e: KeyboardEvent): void {
  if (e.code === 'Enter' || e.code === 'Space') {
    if ((e.target as any).click !== undefined) {
      (e.target as any).click();
    }
  }
}

function renderIcon(): VNode | null {
  return null;
}
</script>

<style lang="scss">
.bs-chart .simple-menu-item {
  display: block;
  cursor: pointer;
  padding: 5px;
  list-style-type: none;
  white-space: nowrap;
  outline: none;

  &:hover {
    background-color: var(--menu-background-color-on-hover);
  }

  &:focus {
    background-color: var(--menu-background-color-on-hover);
  }
}
</style>
