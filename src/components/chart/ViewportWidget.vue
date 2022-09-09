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
import ViewportDataSourceLayer from '@/components/chart/layers/ViewportDataSourceLayer';
import ViewportGridLayer from '@/components/chart/layers/ViewportGridLayer';
import ViewportHighlightingLayer from '@/components/chart/layers/ViewportHighlightingLayer';
import LayeredCanvas, {
  DragMoveEvent,
  MouseClickEvent,
  MousePositionEvent,
  ZoomEvent,
} from '@/components/layered-canvas/LayeredCanvas.vue';
import LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import LayerContext from '@/components/layered-canvas/layers/LayerContext';
import { PaneId } from '@/components/layout/PaneDescriptor';
import DataSourceChangeEventListener, {
  ChangeReasons,
} from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import DataSourceInvalidator from '@/model/datasource/DataSourceInvalidator';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import Viewport from '@/model/viewport/Viewport';
import ViewportHighlightInvalidator from '@/model/viewport/ViewportHighlightInvalidator';
import { PropType } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { InjectReactive, Prop } from 'vue-property-decorator';

@Options({
  components: { LayeredCanvas },
})
export default class ViewportWidget extends Vue {
  @Prop({ type: Object as PropType<Viewport>, required: true })
  private viewportModel!: Viewport;
  @Prop({ type: String as PropType<PaneId>, required: true })
  private paneId!: PaneId;
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
      // shared data from siblings renderer
      // priceline renderer
      this.highlightingLayer,
      // tool/crosshair renderer ??? shared with other panes
    );
  }

  mounted(): void {
    console.debug('ViewportWidget::mounted');
    this.dataSourceInvalidator.installListeners();
    this.dataSourceLayer.installListeners();
    this.highlightingLayer.installListeners();
    this.viewportModel.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);
  }

  unmounted(): void {
    console.debug('ViewportWidget::unmounted');
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

  private onMouseMove(e: MousePositionEvent): void {
    this.highlightInvalidator.invalidate(e);
  }

  private onLeftMouseBtnDoubleClick(): void {
    const { highlighted } = this.viewportModel;
    if (highlighted !== undefined) {
      console.log(`double click on element: ${highlighted[0].ref}`);
    } else {
      console.log('double click on viewport');
    }
  }

  private onLeftMouseBtnClick(e: MouseClickEvent): void {
    this.viewportModel.updateSelection(e.isCtrl);
  }

  private onDragStart(e: MouseClickEvent): void {
    this.viewportModel.updateSelection(e.isCtrl, true);

    if (this.viewportModel.selectionCanBeDragged()) {
      this.viewportModel.dataSource.beginTransaction({ incident: 'drag-in-viewport' });

      if (e.isCtrl) {
        this.viewportModel.cloneSelected();
      }
    }

    this.viewportModel.updateDragHandle();
  }

  private onDrag(e: DragMoveEvent): void {
    if (this.viewportModel.selectionCanBeDragged()) {
      this.highlightInvalidator.invalidate(e);
      this.viewportModel.moveSelected(e);
    } else {
      const { timeAxis, priceAxis } = this.viewportModel;
      timeAxis.move(e.dx);
      priceAxis.move(e.dy);
    }
  }

  private onDragEnd(): void {
    if (this.viewportModel.selectionCanBeDragged()) {
      this.viewportModel.dataSource.endTransaction();
    } else {
      this.tva.getProtocol({ incident: 'move-in-viewport' }).trySign();
    }
  }

  private zoom(e: ZoomEvent): void {
    this.viewportModel.timeAxis.zoom(e.pivot.x, e.delta);
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
