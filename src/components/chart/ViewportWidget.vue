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
  MouseMoveEvent,
  ZoomEvent,
} from '@/components/layered-canvas/LayeredCanvas.vue';
import LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import { InjectReactive, Prop } from 'vue-property-decorator';
import { PropType } from 'vue';
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

  private onMouseMove(e: MouseMoveEvent): void {
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
    this.viewportModel.dataSource.beginTransaction({ incident: 'drag-in-viewport' });
    this.viewportModel.updateSelection(e.isCtrl, true);
    this.viewportModel.updateDragHandle();

    if (this.viewportModel.dragHandle === undefined) {
      const { timeAxis, priceAxis } = this.viewportModel;

      this.tva
        .getProtocol({ incident: 'drag-in-viewport' })
        .setLifeHooks({
          // beforeApply: () => console.debug('protocol before apply'),
          // afterApply: () => console.debug('protocol after apply'),
        })
        .addIncident(new UpdateAxisRange({
          axis: timeAxis,
          range: { ...timeAxis.range },
          // beforeApply: () => console.debug('time axis before apply'),
          // afterApply: () => console.debug('time axis after apply'),
        }), false)
        .addIncident(new UpdateAxisRange({
          axis: priceAxis,
          range: { ...priceAxis.range },
          // beforeApply: () => console.debug('price axis before apply'),
          // afterApply: () => console.debug('price axis after apply'),
        }), false);
    }
  }

  private onDrag(e: DragMoveEvent): void {
    const { timeAxis, priceAxis, dataSource, dragHandle } = this.viewportModel;
    if (dragHandle !== undefined) {
      dragHandle(e);
      dataSource.flush();
    } else {
      timeAxis.move(e.dx);
      priceAxis.move(e.dy);

      this.tva
        .getProtocol({ incident: 'drag-in-viewport' })
        .addIncident(new UpdateAxisRange({
          axis: timeAxis,
          range: { ...timeAxis.range },
        }), false)
        .addIncident(new UpdateAxisRange({
          axis: priceAxis,
          range: { ...priceAxis.range },
        }), false);
    }
  }

  private onDragEnd(): void {
    this.viewportModel.dataSource.endTransaction();
  }

  private zoom(e: ZoomEvent): void {
    const protocol: TVAProtocol = this.tva.getProtocol({ incident: 'zoom-time-axis', timeout: 1000 });
    const { timeAxis: axis } = this.viewportModel;

    if (protocol.isEmpty) {
      // setup initial value
      protocol.addIncident(new UpdateAxisRange({
        axis,
        range: { ...axis.range },
      }));
    }

    axis.zoom(e.pivot, e.delta);

    protocol.addIncident(new UpdateAxisRange({
      axis,
      range: { ...axis.range },
    }));
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
