<template>
  <div
    class="viewport"
    :style="cssVars"
  >
    <layered-canvas
      :options="canvasOptions"
      @drag-start="onDragStart"
      @drag-end="onDragEnd"
      @drag-move="onDrag"
      @mouse-move="onMouseMove"
      @zoom="onZoom"
      @left-mouse-btn-double-click="onLeftMouseBtnDoubleClick"
      @left-mouse-btn-click="onLeftMouseBtnClick"
    />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ViewportDataSourceLayer from '@/components/chart/layers/ViewportDataSourceLayer';
import ViewportGridLayer from '@/components/chart/layers/ViewportGridLayer';
import ViewportHighlightingLayer from '@/components/chart/layers/ViewportHighlightingLayer';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import type { DragMoveEvent, MouseClickEvent, MousePositionEvent, ZoomEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import type LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import type LayerContext from '@/components/layered-canvas/layers/LayerContext';
import type DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';
import type { ChangeReasons } from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import DataSourceInvalidator from '@/model/datasource/DataSourceInvalidator';
import type Viewport from '@/model/viewport/Viewport';
import ViewportHighlightInvalidator from '@/model/viewport/ViewportHighlightInvalidator';

@Options({
  components: { LayeredCanvas },
})
export default class ViewportWidget extends Vue {
  canvasOptions: LayeredCanvasOptions = { layers: [] };
  @Prop({ type: Object as PropType<Viewport>, required: true })
  private viewportModel!: Viewport;
  private highlightInvalidator!: ViewportHighlightInvalidator;
  private dataSourceInvalidator!: DataSourceInvalidator;
  private dataSourceLayer!: ViewportDataSourceLayer;
  private highlightingLayer!: ViewportHighlightingLayer;

  created(): void {
    this.highlightInvalidator = new ViewportHighlightInvalidator(this.viewportModel);
    this.dataSourceInvalidator = new DataSourceInvalidator(this.viewportModel);
    this.dataSourceLayer = this.createDataSourceLayer();
    this.highlightingLayer = this.createHighlightingLayer();

    this.canvasOptions.layers.push(
      this.createGridLayer(),
      this.dataSourceLayer,
      // shared data from siblings renderer
      // priceline renderer
      this.highlightingLayer,
      // tool/crosshair renderer ??? shared with other panes
    );
  }

  mounted(): void {
    this.dataSourceInvalidator.installListeners();
    this.dataSourceLayer.installListeners();
    this.highlightingLayer.installListeners();
    this.viewportModel.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);
  }

  unmounted(): void {
    this.dataSourceInvalidator.uninstallListeners();
    this.dataSourceLayer.uninstallListeners();
    this.highlightingLayer.uninstallListeners();
    this.viewportModel.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
  }

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (reasons: ChangeReasons): void => {
    if (reasons.has(DataSourceChangeEventReason.RemoveEntry)) {
      const { selected, highlighted } = this.viewportModel;
      const removedEntries: DataSourceEntry[] = reasons.get(DataSourceChangeEventReason.RemoveEntry) as DataSourceEntry[];

      for (const removedEntry of removedEntries) {
        if (highlighted === removedEntry) {
          this.viewportModel.highlighted = undefined;
          this.viewportModel.highlightedHandleId = undefined;
          this.viewportModel.cursor = undefined;
        }

        if (selected.has(removedEntry)) {
          selected.delete(removedEntry);
        }
      }
    }
  };

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

  onMouseMove(e: MousePositionEvent): void {
    this.highlightInvalidator.invalidate(e);
  }

  onLeftMouseBtnDoubleClick(): void {
    const { highlighted } = this.viewportModel;
    if (highlighted !== undefined) {
      console.log(`double click on element: ${highlighted[0].ref}`);
    } else {
      console.log('double click on viewport');
    }
  }

  onLeftMouseBtnClick(e: MouseClickEvent): void {
    this.viewportModel.updateSelection(e.isCtrl);
  }

  onDragStart(e: MouseClickEvent): void {
    this.viewportModel.updateSelection(e.isCtrl, true);

    if (this.viewportModel.selectionCanBeDragged()) {
      this.viewportModel.dataSource.beginTransaction({ incident: 'drag-in-viewport' });

      if (e.isCtrl) {
        this.viewportModel.cloneSelected();
      }
    }

    this.viewportModel.updateDragHandle();
  }

  onDrag(e: DragMoveEvent): void {
    if (this.viewportModel.selectionCanBeDragged()) {
      this.highlightInvalidator.invalidate(e);
      this.viewportModel.moveSelected(e);
    } else {
      const { timeAxis, priceAxis } = this.viewportModel;
      timeAxis.move(e.dx);
      priceAxis.move(e.dy);
    }
  }

  onDragEnd(): void {
    const { dataSource } = this.viewportModel;
    if (this.viewportModel.selectionCanBeDragged()) {
      dataSource.endTransaction();
    } else {
      dataSource.tvaClerk.processReport({
        protocolOptions: { incident: 'move-in-viewport' },
        sign: true,
      });
    }
  }

  onZoom(e: ZoomEvent): void {
    this.viewportModel.timeAxis.zoom(e.pivot.x, e.delta);
  }

  get cssVars(): any {
    const cursor: string = this.viewportModel.cursor || 'default';
    return {
      cursor: `${cursor} !important`,
    };
  }
}
</script>

<style scoped>
.viewport {
  display: flex;
  flex: 1 1 auto;
}
</style>
