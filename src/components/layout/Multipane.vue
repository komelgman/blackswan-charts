<template>
  <box-layout :direction="direction" :style="style">
    <template v-for="(item, index) in visibleItems" :key="`item-${item.id}`">
      <divider ref="borderElements" v-if="index !== 0">
        <resize-handle :index="index" v-if="resizable" @resize-move="onResizeHandleMove"/>
      </divider>

      <div ref="paneElements" class="pane" :data-index="index">
        <slot :model="item.model" :paneId="item.id"/>
      </div>
    </template>
  </box-layout>
</template>

<script lang="ts">
import ResizeObserver from 'resize-observer-polyfill';
import type { PropType } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { Prop, Ref, Watch } from 'vue-property-decorator';
import type { PanesSizeChangeEvent } from '@/components/layout/PanesSizeChangedEvent';
import type { PaneDescriptor, ResizeHandleMoveEvent } from '@/components/layout';
import { BoxLayout, Direction, Divider, ResizeHandle } from '@/components/layout';

interface PaneSize {
  min: number;
  max: number;
  elementSize: number;
  targetSize: number;
}

interface Layout {
  minSize: number | undefined;
  maxSize: number | undefined;
}

@Options({
  components: { BoxLayout, ResizeHandle, Divider },
})
export default class Multipane<T> extends Vue {
  @Prop({ type: Boolean, default: false })
  public resizable!: boolean;
  @Prop({ type: String as PropType<Direction>, default: Direction.Vertical })
  public direction!: Direction;
  @Prop({ type: Array as () => PaneDescriptor<T>[], required: true })
  private items!: PaneDescriptor<T>[];
  @Ref('paneElements')
  private paneElements!: HTMLElement[];
  @Ref('borderElements')
  private borderElements!: Divider[];

  private resizeObserver!: ResizeObserver;
  private valid: boolean = true;

  layout: Layout = {
    minSize: undefined,
    maxSize: undefined,
  };

  get style(): any {
    const result: any = {};

    const { layout } = this;

    const minSize = layout.minSize === undefined ? undefined : `${layout.minSize}px`;
    const maxSize = layout.maxSize === undefined ? undefined : `${layout.maxSize}px`;

    if (this.direction === Direction.Horizontal) {
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
  }

  get visibleItems(): PaneDescriptor<T>[] {
    return this.items.filter((item) => item.visible === undefined || item.visible);
  }

  private sortedPaneElements(): HTMLElement[] {
    return this.paneElements
      ? this.paneElements.sort((a, b) => (a.dataset.index as any) - (b.dataset.index as any))
      : [];
  }

  created(): void {
    this.resizeObserver = new ResizeObserver(this.resizeObserverCallback);
  }

  mounted(): void {
    this.resizeObserver.observe(this.$el);
  }

  unmounted(): void {
    this.resizeObserver.disconnect();
  }

  @Watch('visibleItems')
  private visibleItemsChanged(): void {
    console.debug('multipane.visibleItemsChanged');
    this.invalidate();
  }

  private resizeObserverCallback(): void {
    console.debug('multipane.resizeObserverCallback');
    this.invalidate();
  }

  public invalidate(): void {
    console.debug('multipane.invalidate');
    if (this.valid) {
      this.valid = false;
      this.$nextTick(this.adjustPanesSizes);
    }
  }

  private adjustPanesSizes(): void {
    this.valid = true;
    console.debug('multipane.adjustPanesSizes');

    const availableSize = this.getSize(this.$el);
    const panesInfo: PaneSize[] = [];
    const paneElements = this.sortedPaneElements();

    // calculate size which occupied by borders
    let bordersSize = 0;
    for (let i = 0; i < this.borderElements?.length || 0; i += 1) {
      bordersSize += this.getSize(this.borderElements[i].$el);
    }

    // get/calc init params from elements and props
    let minimumSize = 0;
    let maximumSize = 0;
    let retrievedSize = 0;
    for (let i = 0; i < this.visibleItems?.length || 0; i += 1) {
      const pane = paneElements[i];
      const paneDesc = this.visibleItems[i];
      const paneSize: number = this.getSize(pane);

      if (paneDesc.minSize === undefined) {
        paneDesc.minSize = 0;
      }

      if (paneDesc.size === undefined) {
        paneDesc.size = paneDesc.minSize || 1;
      }

      if (paneDesc.maxSize === undefined) {
        paneDesc.maxSize = Number.MAX_VALUE;
      }

      if (paneDesc.size < paneDesc.minSize) {
        throw new Error('paneDesc.actualSize < paneDesc.minSize');
      }

      panesInfo.push({
        min: paneDesc.minSize,
        max: paneDesc.maxSize,
        elementSize: paneSize,
        targetSize: paneDesc.size,
      });

      minimumSize += paneDesc.minSize;
      retrievedSize += paneDesc.size;

      if (maximumSize < Number.MAX_VALUE) {
        maximumSize = paneDesc.maxSize === Number.MAX_VALUE
          ? Number.MAX_VALUE
          : maximumSize + paneDesc.maxSize;
      }
    }

    if ((minimumSize + bordersSize) > availableSize) {
      throw new Error('minimumSize + bordersSize > availableSize');
    }

    const scale = (availableSize - bordersSize) / retrievedSize;
    let shouldBeDistributed: number = 0;
    let availableForStretch = panesInfo.length;
    let availableForShrink = panesInfo.length;
    for (const info of panesInfo) {
      let size = info.targetSize * scale;

      if (size > info.max) {
        shouldBeDistributed += size - info.max;
        size = info.max;
      }

      if (size < info.min) {
        shouldBeDistributed -= info.min - size;
        size = info.min;
      }

      if (size === info.max) {
        availableForStretch -= 1;
      }

      if (size === info.min) {
        availableForShrink -= 1;
      }

      info.elementSize = size;
    }

    // stretch/shrink not distributed space
    const eps = 0.00001;

    // shrink
    let circleBreaker = 100;
    while ((shouldBeDistributed + eps) < 0 && availableForShrink > 0) {
      const dSize = -shouldBeDistributed / availableForShrink;

      for (const info of panesInfo) {
        if (info.min === info.elementSize) {
          continue;
        }

        let size = info.elementSize - dSize;
        if (size <= info.min) {
          size = info.min;
          availableForShrink -= 1;
        }

        shouldBeDistributed += info.elementSize - size;
        info.elementSize = size;
      }

      circleBreaker -= 1;
      if (circleBreaker === 0) {
        throw new Error('shrink infinite loop');
      }
    }

    // stretch
    circleBreaker = 100;
    while ((shouldBeDistributed - eps) > 0 && availableForStretch > 0) {
      const dSize = shouldBeDistributed / availableForStretch;

      for (const info of panesInfo) {
        if (info.max === info.elementSize) {
          continue;
        }

        let size = info.elementSize + dSize;
        if (size >= info.max) {
          size = info.max;
          availableForStretch -= 1;
        }

        shouldBeDistributed -= size - info.elementSize;
        info.elementSize = size;
      }

      circleBreaker -= 1;
      if (circleBreaker === 0) {
        throw new Error('stretch infinite loop');
      }
    }

    // fix inaccuracy and apply size to property and elements
    let computedSize = 0;
    for (const info of panesInfo) {
      computedSize += info.elementSize;
    }

    let fix = availableSize - computedSize - bordersSize;
    this.$nextTick(() => {
      if (minimumSize > 0) {
        this.layout.minSize = (minimumSize + bordersSize) * Multipane.getDPR();
      } else {
        this.layout.minSize = undefined;
      }

      if (maximumSize < Number.MAX_VALUE) {
        this.layout.maxSize = (maximumSize + bordersSize) * Multipane.getDPR();
      } else {
        this.layout.maxSize = undefined;
      }

      for (let i = 0; i < panesInfo.length; i += 1) {
        const info: PaneSize = panesInfo[i];
        let size = info.elementSize;
        if ((size + fix) >= info.min && (size + fix) <= info.max) {
          size += fix;
          fix = 0;
        }

        this.setSize(paneElements[i], size);
        this.visibleItems[i].size = size;
      }
    });
  }

  onResizeHandleMove(e: ResizeHandleMoveEvent): void {
    const items = this.visibleItems;
    const dsize = (this.direction === Direction.Vertical ? e.dy : e.dx) * Multipane.getDPR();
    const deltaSign = Math.sign(dsize);
    const paneElements = this.sortedPaneElements();
    let deltaSize = Math.abs(dsize);
    const initialSizes = items.map((v) => v.size);

    while (deltaSize > 0) {
      const decPaneIndex: number | undefined = this.getDecPaneIndex(deltaSign, e.index, items);
      const incPaneIndex: number | undefined = this.getIncPaneIndex(deltaSign, e.index, items);

      if (decPaneIndex === undefined || incPaneIndex === undefined) {
        e.sender.dragBlocked = true;
        break;
      }

      const decItem: PaneDescriptor<T> = items[decPaneIndex];
      const incItem: PaneDescriptor<T> = items[incPaneIndex];
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
      this.setSize(paneElements[decPaneIndex], decItem.size);
      this.setSize(paneElements[incPaneIndex], incItem.size);

      deltaSize = shouldBeDistributed;
    }

    const changedSizes = items.map((v) => v.size);

    this.$emit('drag-handle-moved', {
      source: this,
      initial: initialSizes,
      changed: changedSizes,
    } as PanesSizeChangeEvent);
  }

  private getDecPaneIndex(sign: number, index: number, items: PaneDescriptor<T>[]): number | undefined {
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

  private getIncPaneIndex(sign: number, index: number, items: PaneDescriptor<T>[]): number | undefined {
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

  private static getDPR(): number {
    return window.devicePixelRatio || 1;
  }

  private getSize(el: HTMLElement): number {
    const rect: DOMRect = el.getBoundingClientRect();
    return (this.direction === Direction.Horizontal ? rect.width : rect.height) * Multipane.getDPR();
  }

  private setSize(el: HTMLElement, size: number): void {
    if (this.direction === Direction.Horizontal) {
      el.style.width = `${size / Multipane.getDPR()}px`;
    } else {
      el.style.height = `${size / Multipane.getDPR()}px`;
    }
  }
}
</script>

<style lang="scss">
.boxlayout > {
  .pane {
    background-color: var(--primary-background-color);
    display: flex;
    flex: 1 1 auto;
    position: relative;
  }
}
</style>
