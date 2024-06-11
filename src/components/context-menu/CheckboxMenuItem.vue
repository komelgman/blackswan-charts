<template>
  <a
      tabindex="0"
      class="checkbox-menu-item"
      :style="model.style"
      @mousedown="model.onclick"
      @keypress="onKeyPress"
  >
    <span v-if="model.checked" class="tickmark">&#x2714;</span>
    {{ model.title }}
  </a>
</template>

<script setup lang="ts">
import type { CheckboxMenuItemModel } from '@/components/context-menu/ContextMenuOptions';

interface Props {
  model: CheckboxMenuItemModel;
}

const { model } = defineProps<Props>();

const onKeyPress = (e: KeyboardEvent): void => {
  if (e.code === 'Enter' || e.code === 'Space') {
    if ((e.target as any).click !== undefined) {
      (e.target as any).click();
    }
  }
};
</script>

<style lang="scss" scoped>
.checkbox-menu-item {
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

.tickmark {
  position: absolute;
  left: 5px;
  display: block;
  width: 21px;
  height: 21px;
  text-align: center;
}
</style>
