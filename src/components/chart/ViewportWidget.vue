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
      @zoom="zoom"
      @left-mouse-btn-double-click="onLeftMouseBtnDoubleClick"
      @left-mouse-btn-click="onLeftMouseBtnClick"
    />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import LayeredCanvas, {
  DragMoveEvent,
  MouseClickEvent,
  MousePositionEvent,
  ZoomEvent,
} from '@/components/layered-canvas/LayeredCanvas.vue';
import LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import { InjectReactive, Prop } from 'vue-property-decorator';
import { PropType, toRaw } from 'vue';
import Viewport from '@/model/viewport/Viewport';
import ViewportHighlightInvalidator from '@/model/viewport/ViewportHighlightInvalidator';
import LayerContext from '@/components/layered-canvas/layers/LayerContext';
import ViewportDataSourceLayer from '@/components/chart/layers/ViewportDataSourceLayer';
import ViewportHighlightingLayer from '@/components/chart/layers/ViewportHighlightingLayer';
import ViewportGridLayer from '@/components/chart/layers/ViewportGridLayer';
import DataSourceInvalidator from '@/model/datasource/DataSourceInvalidator';
import DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import UpdateAxisRange from '@/model/axis/incidents/UpdateAxisRange';
import TVAProtocol from '@/model/history/TVAProtocol';
import { DrawingId } from '@/model/datasource/Drawing';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import Sketcher from '@/model/datasource/Sketcher';

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

  @InjectReactive()
  private tva!: TimeVarianceAuthority;

  created(): void {
    this.highlightInvalidator = new ViewportHighlightInvalidator(this.viewportModel);
    this.dataSourceInvalidator = new DataSourceInvalidator(this.viewportModel);
    this.dataSourceLayer = this.createDataSourceLayer();
    this.highlightingLayer = this.createHighlightingLayer();

    this.canvasOptions.layers.push(
      this.createGridLayer(),
      this.dataSourceLayer,
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

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (reasons: Set<DataSourceChangeEventReason>): void => {
    if (reasons.has(DataSourceChangeEventReason.RemoveEntry)) {
      const { dataSource, selected, highlighted } = this.viewportModel;
      if (highlighted !== undefined && !dataSource.has(highlighted[0].id)) {
        this.viewportModel.highlighted = undefined;
        this.viewportModel.highlightedHandleId = undefined;
        this.viewportModel.cursor = undefined;
      }

      selected.forEach((v) => {
        if (!dataSource.has(v)) {
          selected.delete(v);
        }
      });
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

  private onMouseMove(e: MousePositionEvent): void {
    this.highlightInvalidator.invalidate(e);
  }

  private onLeftMouseBtnDoubleClick(): void {
    const { highlighted } = this.viewportModel;
    if (highlighted !== undefined) {
      console.log(`double click on element: ${highlighted[0].id}`);
    } else {
      console.log('double click on viewport');
    }
  }

  private onLeftMouseBtnClick(e: MouseClickEvent): void {
    this.viewportModel.updateSelection(e.isCtrl);
  }

  private onDragStart(e: MouseClickEvent): void {
    this.viewportModel.updateSelection(e.isCtrl, true);

    if (this.viewportModel.selected.size > 0) {
      this.viewportModel.dataSource.beginTransaction({ incident: 'drag-in-viewport' });

      if (e.isCtrl) {
        this.viewportModel.cloneSelected();
      }
    }

    this.viewportModel.updateDragHandle();
  }

  private onDrag(e: DragMoveEvent): void {
    if (this.viewportModel.selected.size > 0) {
      this.highlightInvalidator.invalidate(e);
      this.viewportModel.moveSelected(e);
    } else {
      const { timeAxis, priceAxis } = this.viewportModel;
      timeAxis.move(e.dx);
      priceAxis.move(e.dy);
    }
  }

  private onDragEnd(): void {
    if (this.viewportModel.selected.size > 0) {
      this.viewportModel.dataSource.endTransaction();
    } else {
      this.tva.getProtocol({ incident: 'move-in-viewport' }).trySign();
    }
  }

  private zoom(e: ZoomEvent): void {
    this.viewportModel.timeAxis.zoom(e.pivot, e.delta);
  }

  get cssVars(): unknown {
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
