<template>
  <div :class="classnames">
    <slot/>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Direction } from '../model/types';

export interface Props {
  direction?: Direction;
}

const { direction = Direction.Horizontal } = defineProps<Props>();
const classnames = computed(() => ['boxlayout', `layout-${direction}`]);
</script>

<style scoped lang="scss">
.boxlayout {
  display: flex;
  flex-wrap: nowrap;
  flex: 1 1 auto;
  height: 100%;
  width: 100%;

  &.layout-horizontal {
    flex-direction: row;
  }

  &.layout-vertical {
    flex-direction: column;
  }
}
</style>
