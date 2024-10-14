<template>
  <div :class="classnames">
    <slot/>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Thickness } from '@/components/layout/types';

interface Props {
  thickness?: Thickness;
}

const { thickness = Thickness.Thin } = defineProps<Props>();
const classnames = computed(() => ['divider', `divider-${thickness}`]);
</script>

<style lang="scss">
$divider-thin: 1px;
$divider-wide: 4px;

.layout-vertical > {
  .divider {
    width: 100%;
    height: 0;
    min-height: 0;
    max-height: 0;
    background-color: var(--border-color);

    &.divider-thin {
      border-top: var(--border-color) $divider-thin solid;
    }

    &.divider-wide {
      border-top: var(--border-color) $divider-wide solid;
    }
  }
}

.layout-horizontal > {
  .divider {
    height: 100%;
    width: 0;
    max-width: 0;
    min-width: 0;
    background-color: var(--border-color);

    &.divider-thin {
      border-right: var(--border-color) $divider-thin solid;
    }

    &.divider-wide {
      border-right: var(--border-color) $divider-wide solid;
    }
  }
}
</style>
