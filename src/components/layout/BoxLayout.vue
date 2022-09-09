<template>
  <div :class="classnames">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Direction } from '@/components/layout';
import { PropType } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

@Options({})
export default class BoxLayout extends Vue {
  @Prop({ type: String as PropType<Direction>, default: Direction.Horizontal })
  protected direction!: Direction;

  get classnames(): string[] {
    return ['boxlayout', `layout-${this.direction}`];
  }
}
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
