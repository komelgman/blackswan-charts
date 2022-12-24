<template>
  <div :class="classnames">
    <slot/>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { Thickness } from '@/components/layout';

@Options({})
export default class Divider extends Vue {
  @Prop({ type: String as PropType<Thickness>, default: Thickness.Thin })
  protected thickness!: Thickness;

  get classnames(): string[] {
    return ['divider', `divider-${this.thickness}`];
  }
}
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
