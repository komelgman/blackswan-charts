<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { ChartWidget } from 'blackswan-charts';
import 'blackswan-charts/style.css';
import type { ExampleScene } from '@demo/gallery/types';

// Create the scene once in the parent's setup, then pass it here.
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
