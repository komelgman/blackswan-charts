<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { ChartWidget } from 'blackswan-charts';
import 'blackswan-charts/style.css';
import ObjectEventTooltip from '@demo/gallery/ObjectEventTooltip.vue';
import type { ExampleScene } from '@demo/gallery/types';

const props = defineProps<{ scene: ExampleScene }>();
onMounted(() => props.scene.start?.());
onUnmounted(() => {
  props.scene.dispose?.();
  props.scene.chart.panes.forEach(pane => pane.model.priceReference.stop());
});
</script>

<template>
  <div class="embedded-chart-host">
    <ChartWidget :chart="scene.chart" class="embedded-chart" />
    <ObjectEventTooltip :event="scene.objectEvent" />
  </div>
</template>

<style scoped>
.embedded-chart-host,
.embedded-chart {
  height: 100%;
  width: 100%;
}
.embedded-chart-host {
  position: relative;
}
</style>
