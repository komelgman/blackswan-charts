<template>
  <div :class="classnames">
    <slot/>
  </div>
</template>

<script setup lang="ts">
import Direction from '@/components/layout/Direction';
import { computed } from 'vue';

interface Props {
  direction?: Direction;
}

const { direction } = withDefaults(defineProps<Props>(), {
  direction: Direction.Horizontal
});

const classnames = computed(() => {
  return ['boxlayout', `layout-${direction}`];
});
</script>

<style lang="scss">
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
