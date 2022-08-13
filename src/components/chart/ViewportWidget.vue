<template>
  <div class="viewport" :style="cssVars" @click.left="onClick">
    <layered-canvas
      :options="canvasOptions"
      @drag-start="onDragStart"
      @drag-end="onDragEnd"
      @drag-move="onDrag"
      @mouse-move="onMouseMove"
      @double-click="onDoubleClick"
    />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import LayeredCanvas, {
  DragMoveEvent,
  MouseClickEvent,
  MouseMoveEvent,
} from '@/components/layered-canvas/LayeredCanvas.vue';
import LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import { InjectReactive, Prop } from 'vue-property-decorator';
import { PropType, unref } from 'vue';
import Viewport from '@/model/viewport/Viewport';
import ViewportHighlightInvalidator from '@/model/viewport/ViewportHighlightInvalidator';
import { DragHandle } from '@/model/viewport/DragHandle';

import LayerContext from '@/components/layered-canvas/layers/LayerContext';
import Sketcher from '@/model/datasource/Sketcher';
import { DrawingType } from '@/model/datasource/Drawing';
import ViewportDataSourceLayer from '@/components/chart/layers/ViewportDataSourceLayer';
import ViewportHighlightingLayer from '@/components/chart/layers/ViewportHighlightingLayer';
import ViewportGridLayer from '@/components/chart/layers/ViewportGridLayer';
import DataSourceInvalidator from '@/model/datasource/DataSourceInvalidator';

@Options({
  components: { LayeredCanvas },
})
export default class ViewportWidget extends Vue {
  @Prop({ type: Object as PropType<Viewport>, required: true })
  private viewportModel!: Viewport;
  private canvasOptions: LayeredCanvasOptions = { layers: [] };
  private highlightInvalidator!: ViewportHighlightInvalidator;
  private dataSourceInvalidator!: DataSourceInvalidator;
  private dataSourceLayer!: ViewportDataSourceLayer;
  private highlightingLayer!: ViewportHighlightingLayer;
  private isDrag: boolean = false;
  private dragHandle?: DragHandle = undefined;

  @InjectReactive()
  private sketchers!: Map<DrawingType, Sketcher>;

  created(): void {
    this.highlightInvalidator = new ViewportHighlightInvalidator(this.viewportModel);
    this.dataSourceInvalidator = new DataSourceInvalidator(this.viewportModel, this.sketchers);
    this.dataSourceLayer = this.createDataSourceLayer();
    this.highlightingLayer = this.createHighlightingLayer();

    this.canvasOptions.layers.push(
      this.createGridLayer(),
      this.dataSourceLayer,
      // priceline renderer
      this.highlightingLayer,
      // tool/crosshair renderer ??? shared with other panes
    );

    unref(this.viewportModel.dataSource);
  }

  mounted(): void {
    this.dataSourceInvalidator.installListeners();
    this.dataSourceLayer.installListeners();
    this.highlightingLayer.installListeners();
  }

  unmounted(): void {
    this.dataSourceInvalidator.uninstallListeners();
    this.dataSourceLayer.uninstallListeners();
    this.highlightingLayer.uninstallListeners();
  }

  private createGridLayer(): ViewportGridLayer {
    const { timeAxis, priceAxis } = this.viewportModel;
    return new ViewportGridLayer(timeAxis, priceAxis);
  }

  private createDataSourceLayer(): ViewportDataSourceLayer {
    const { dataSource, priceAxis } = this.viewportModel;
    const result: ViewportDataSourceLayer = new ViewportDataSourceLayer(dataSource, priceAxis.inverted);

    result.addContextChangeListener((newCtx: LayerContext) => {
      this.highlightInvalidator.layerContext = newCtx;
      this.dataSourceInvalidator.context = newCtx;
    });

    return result;
  }

  private createHighlightingLayer(): ViewportHighlightingLayer {
    return new ViewportHighlightingLayer(this.viewportModel);
  }

  private onClick(e: MouseEvent): void {
    if (!e.defaultPrevented) {
      e.preventDefault();

      console.log(`ctrl: ${e.ctrlKey}`);
      console.log(`shift: ${e.shiftKey}`);
      console.log(`button: ${e.button}`);

      this.$emit('one-click', { x: e.x, y: e.y });
    }
  }

  private onDoubleClick(e: MouseClickEvent): void {
    const { highlighted } = this.viewportModel;
    if (highlighted !== undefined) {
      console.log(`double click on element: ${highlighted[0].id}`);
    } else {
      console.log('double click on viewport');
    }
  }

  private onDragStart(e: MouseMoveEvent): void {
    this.isDrag = true;
    const { highlighted } = this.viewportModel;
    this.dragHandle = undefined;
    if (highlighted !== undefined && !highlighted[0].locked) {
      const sketcher: Sketcher | undefined = this.sketchers.get(highlighted[0].type);
      if (sketcher === undefined) {
        throw new Error(`OOPS, sketcher wasn't found for type ${highlighted[0].type}`);
      }

      this.dragHandle = sketcher.dragHandle(this.viewportModel);
    }
  }

  private onDragEnd(): void {
    this.isDrag = false;
    this.dragHandle = undefined;
    this.dataSourceInvalidator.cleanDataSourceCache();
  }

  private onDrag(e: DragMoveEvent): void {
    if (this.dragHandle !== undefined) {
      this.dragHandle(e);
    } else {
      this.viewportModel.timeAxis.move(e.dx);
      this.viewportModel.priceAxis.move(e.dy);
    }
  }

  private onMouseMove(e: MouseMoveEvent): void {
    this.highlightInvalidator.invalidate(e);
  }

  get cssVars(): any {
    const cursorValue = this.cursor();

    return {
      cursor: cursorValue,
    };
  }

  private cursor(): string {
    return this.viewportModel.cursor || 'default';
  }
}
</script>

<style scoped>
.viewport {
  display: flex;
  flex: 1 1 auto;
}
</style>
